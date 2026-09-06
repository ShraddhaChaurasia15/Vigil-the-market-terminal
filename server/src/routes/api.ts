import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db.js";
import { marketProvider } from "../engine/marketData.js";
import { evaluateIndianStockDelta, formatIndianVolume, AttentionTier } from "../engine/deltaEngine.js";

export const router = Router();
const USER_ID = "default_user";

function getActiveCheckpoint(): { id: string; checkpoint_time: string; label: string } {
  const stmt = db.prepare(`
    SELECT id, checkpoint_time, label FROM user_checkpoints
    WHERE user_id = ? AND is_active = 1
    ORDER BY checkpoint_time DESC LIMIT 1
  `);
  let cp = stmt.get(USER_ID) as { id: string; checkpoint_time: string; label: string } | undefined;

  if (!cp) {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const id = uuidv4();
    const label = "Initial Desk Checkpoint (2h ago)";
    db.prepare(`
      INSERT INTO user_checkpoints (id, user_id, checkpoint_time, label, is_active)
      VALUES (?, ?, ?, ?, 1)
    `).run(id, USER_ID, twoHoursAgo, label);
    cp = { id, checkpoint_time: twoHoursAgo, label };
  }
  return cp;
}

// 1. Market Regime & Benchmarks (NIFTY 50, SENSEX, INDIA VIX)
router.get("/market/regime", (req: Request, res: Response) => {
  res.json(marketProvider.getMarketRegime());
});

// 2. List Watchlists
router.get("/watchlists", (req: Request, res: Response) => {
  const watchlists = db.prepare(`
    SELECT w.*, COUNT(i.id) as ticker_count
    FROM watchlists w
    LEFT JOIN watchlist_items i ON w.id = i.watchlist_id
    GROUP BY w.id
    ORDER BY w.is_default DESC, w.created_at ASC
  `).all();
  res.json(watchlists);
});

// 3. Create Watchlist
router.post("/watchlists", (req: Request, res: Response) => {
  const { name, description } = req.body;
  const id = uuidv4();
  db.prepare(`
    INSERT INTO watchlists (id, name, description, is_default)
    VALUES (?, ?, ?, 0)
  `).run(id, name || "Custom Watchlist", description || "");
  res.status(201).json({ id, name, description });
});

// 4. Get Watchlist Details with Stateful Delta Computation
router.get("/watchlists/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const wl = db.prepare("SELECT * FROM watchlists WHERE id = ?").get(id) as any;
  if (!wl) {
    return res.status(404).json({ error: "Watchlist not found" });
  }

  const items = db.prepare("SELECT * FROM watchlist_items WHERE watchlist_id = ?").all(id) as any[];
  const cp = getActiveCheckpoint();

  // Elapsed human string
  const diffMs = Math.max(0, Date.now() - new Date(cp.checkpoint_time).getTime());
  const diffMins = Math.max(1, Math.floor(diffMs / 60000));
  let elapsedHuman = `${diffMins}m ago`;
  if (diffMins >= 60) {
    const hrs = Math.floor(diffMins / 60);
    const remM = diffMins % 60;
    elapsedHuman = `${hrs}h ${remM}m ago`;
  }

  const regime = marketProvider.getMarketRegime();
  const niftyChange = regime.benchmarks.find(b => b.symbol === "NIFTY 50")?.changePct || 0.48;

  let urgentCount = 0;
  let developingCount = 0;
  let steadyCount = 0;

  const tickers = items.map(item => {
    const profile = marketProvider.getTickerProfile(item.ticker);
    const intraday = marketProvider.generateIntradayData(item.ticker, diffMins);

    const todayChangeAmt = Math.round((intraday.currentPrice - profile.basePrice) * 100) / 100;
    const todayChangePct = Math.round((todayChangeAmt / profile.basePrice) * 10000) / 100;

    const evaluation = evaluateIndianStockDelta({
      ticker: profile.ticker,
      currentPrice: intraday.currentPrice,
      checkpointPrice: intraday.checkpointPrice,
      beta: profile.beta,
      niftyChangePct: niftyChange,
      rvol: intraday.rvol,
      ema20: profile.ema20,
      ema50: profile.ema50,
      targetPrice: item.target_price,
      stopPrice: item.stop_price,
      catalystHeadline: intraday.catalystHeadline
    });

    if (evaluation.attentionTier === "URGENT") urgentCount++;
    else if (evaluation.attentionTier === "DEVELOPING") developingCount++;
    else steadyCount++;

    return {
      ticker: profile.ticker,
      name: profile.name,
      exchange: profile.exchange,
      sector: profile.sector,
      currentPrice: intraday.currentPrice,
      todayChangeAmt,
      todayChangePct,
      checkpointPrice: intraday.checkpointPrice,
      deltaSinceCheckpointAmt: evaluation.deltaAmt,
      deltaSinceCheckpointPct: evaluation.deltaPct,
      volume: intraday.volume,
      formattedVolume: formatIndianVolume(intraday.volume),
      rvol: intraday.rvol,
      beta: profile.beta,
      isMeaningfulChange: evaluation.isMeaningfulChange,
      attentionTier: evaluation.attentionTier,
      deltaScore: evaluation.deltaScore,
      factors: evaluation.factors,
      sparkline: intraday.sparkline,
      notes: item.notes,
      targetPrice: item.target_price,
      stopPrice: item.stop_price,
      catalystHeadline: intraday.catalystHeadline
    };
  });

  // Sort by Delta Score descending (most urgent/critical first)
  tickers.sort((a, b) => b.deltaScore - a.deltaScore);

  // Executive Feed items (top 4 critical/developing movers)
  const executiveFeed = tickers
    .filter(t => t.attentionTier !== "STEADY" && t.factors.length > 0)
    .slice(0, 4)
    .map(t => ({
      id: uuidv4(),
      ticker: t.ticker,
      tier: t.attentionTier,
      headline: `${t.ticker}: ${t.factors[0].label}`,
      detail: t.factors[0].description,
      deltaPct: t.deltaSinceCheckpointPct,
      catalyst: t.catalystHeadline
    }));

  res.json({
    id: wl.id,
    name: wl.name,
    description: wl.description,
    checkpoint: {
      id: cp.id,
      checkpointTime: cp.checkpoint_time,
      elapsedHuman,
      label: cp.label,
      totalTickers: tickers.length,
      urgentCount,
      developingCount,
      steadyCount
    },
    executiveFeed,
    tickers
  });
});

// 5. Add Ticker to Watchlist
router.post("/watchlists/:id/items", (req: Request, res: Response) => {
  const { id } = req.params;
  const { ticker, notes, targetPrice, stopPrice } = req.body;
  if (!ticker) {
    return res.status(400).json({ error: "Ticker symbol is required" });
  }

  const clean = ticker.toUpperCase().replace(/\.(NS|BO)$/, "").trim();
  try {
    db.prepare(`
      INSERT INTO watchlist_items (watchlist_id, ticker, notes, target_price, stop_price)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, clean, notes || "", targetPrice || null, stopPrice || null);
    res.status(201).json({ status: "added", ticker: clean });
  } catch (err: any) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ error: "Ticker already exists in this watchlist" });
    }
    res.status(500).json({ error: err.message });
  }
});

// 6. Remove Ticker from Watchlist
router.delete("/watchlists/:id/items/:ticker", (req: Request, res: Response) => {
  const { id, ticker } = req.params;
  const clean = ticker.toUpperCase().trim();
  db.prepare(`
    DELETE FROM watchlist_items
    WHERE watchlist_id = ? AND ticker = ?
  `).run(id, clean);
  res.json({ status: "removed", ticker: clean });
});

// 7. Acknowledge Checkpoint ("Mark as Reviewed")
router.post("/checkpoints/acknowledge", (req: Request, res: Response) => {
  const now = new Date().toISOString();
  const id = uuidv4();
  const label = req.body.label || "Reviewed by Trader";

  db.prepare("UPDATE user_checkpoints SET is_active = 0 WHERE user_id = ?").run(USER_ID);
  db.prepare(`
    INSERT INTO user_checkpoints (id, user_id, checkpoint_time, label, is_active)
    VALUES (?, ?, ?, ?, 1)
  `).run(id, USER_ID, now, label);

  res.json({ status: "acknowledged", checkpointTime: now, label });
});

// 8. Evaluator Time Scrubber (Simulate stepping away)
router.post("/checkpoints/simulate", (req: Request, res: Response) => {
  const { preset, customMinutesAgo } = req.body;
  const now = Date.now();
  let pastMs = 2 * 60 * 60 * 1000; // default 2h
  let label = "Simulated Absence (2 hours ago)";

  if (preset === "30M_AGO") {
    pastMs = 30 * 60 * 1000;
    label = "Simulated Absence (30 minutes ago)";
  } else if (preset === "2H_AGO") {
    pastMs = 2 * 60 * 60 * 1000;
    label = "Simulated Absence (2 hours ago)";
  } else if (preset === "MARKET_OPEN") {
    pastMs = 5 * 60 * 60 * 1000;
    label = "Simulated Absence (Market Open 09:15 IST)";
  } else if (preset === "YESTERDAY_CLOSE") {
    pastMs = 24 * 60 * 60 * 1000;
    label = "Simulated Absence (Yesterday Close)";
  } else if (customMinutesAgo) {
    pastMs = customMinutesAgo * 60 * 1000;
    label = `Simulated Absence (${customMinutesAgo}m ago)`;
  }

  const targetTime = new Date(now - pastMs).toISOString();
  const id = uuidv4();

  db.prepare("UPDATE user_checkpoints SET is_active = 0 WHERE user_id = ?").run(USER_ID);
  db.prepare(`
    INSERT INTO user_checkpoints (id, user_id, checkpoint_time, label, is_active)
    VALUES (?, ?, ?, ?, 1)
  `).run(id, USER_ID, targetTime, label);

  res.json({ status: "simulated", checkpointTime: targetTime, label });
});

// 9. Shock Simulation (Evaluator tool to test live reactions)
router.post("/simulate/shock", (req: Request, res: Response) => {
  const { ticker, shockPct, headline } = req.body;
  marketProvider.injectShock(ticker, shockPct, headline);
  res.json({ status: "shock_injected", ticker, shockPct });
});

router.post("/simulate/reset", (req: Request, res: Response) => {
  marketProvider.clearShocks();
  res.json({ status: "reset" });
});
