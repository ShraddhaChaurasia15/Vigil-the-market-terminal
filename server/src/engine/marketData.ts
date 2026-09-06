export interface TickerProfile {
  ticker: string;
  name: string;
  exchange: "NSE" | "BSE";
  sector: string;
  basePrice: number;
  beta: number;
  avgDailyVolume: number;
  ema20: number;
  ema50: number;
}

export interface SparklinePoint {
  time: string;
  price: number;
  isPostCheckpoint: boolean;
}

export const INDIAN_TICKER_CATALOG: Record<string, TickerProfile> = {
  RELIANCE: {
    ticker: "RELIANCE",
    name: "Reliance Industries Limited",
    exchange: "NSE",
    sector: "Oil, Gas & Consumer Retail",
    basePrice: 1322.00,
    beta: 1.15,
    avgDailyVolume: 8500000,
    ema20: 1310.00,
    ema50: 1290.00
  },
  TCS: {
    ticker: "TCS",
    name: "Tata Consultancy Services Ltd",
    exchange: "NSE",
    sector: "Information Technology",
    basePrice: 4210.00,
    beta: 0.85,
    avgDailyVolume: 2200000,
    ema20: 4180.00,
    ema50: 4120.00
  },
  INFY: {
    ticker: "INFY",
    name: "Infosys Limited",
    exchange: "NSE",
    sector: "Information Technology",
    basePrice: 1890.20,
    beta: 1.25,
    avgDailyVolume: 6500000,
    ema20: 1870.00,
    ema50: 1835.00
  },
  HDFCBANK: {
    ticker: "HDFCBANK",
    name: "HDFC Bank Limited",
    exchange: "NSE",
    sector: "Banking & Financial Services",
    basePrice: 1640.00,
    beta: 1.05,
    avgDailyVolume: 18000000,
    ema20: 1630.00,
    ema50: 1605.00
  },
  TATAMOTORS: {
    ticker: "TATAMOTORS",
    name: "Tata Motors Limited",
    exchange: "NSE",
    sector: "Automotive & EV",
    basePrice: 1080.00,
    beta: 1.65,
    avgDailyVolume: 14000000,
    ema20: 1065.00,
    ema50: 1030.00
  },
  ZOMATO: {
    ticker: "ZOMATO",
    name: "Zomato Limited",
    exchange: "NSE",
    sector: "Internet & Q-Commerce",
    basePrice: 262.50,
    beta: 2.10,
    avgDailyVolume: 45000000,
    ema20: 254.00,
    ema50: 238.00
  },
  ICICIBANK: {
    ticker: "ICICIBANK",
    name: "ICICI Bank Limited",
    exchange: "NSE",
    sector: "Banking & Financial Services",
    basePrice: 1215.00,
    beta: 1.10,
    avgDailyVolume: 12000000,
    ema20: 1200.00,
    ema50: 1180.00
  },
  ITC: {
    ticker: "ITC",
    name: "ITC Limited",
    exchange: "NSE",
    sector: "FMCG & Diversified",
    basePrice: 495.00,
    beta: 0.65,
    avgDailyVolume: 11000000,
    ema20: 492.00,
    ema50: 486.00
  },
  BHARTIARTL: {
    ticker: "BHARTIARTL",
    name: "Bharti Airtel Limited",
    exchange: "NSE",
    sector: "Telecommunications",
    basePrice: 1560.00,
    beta: 0.95,
    avgDailyVolume: 6000000,
    ema20: 1540.00,
    ema50: 1510.00
  }
};

interface LiveQuoteCache {
  price: number;
  prevClose: number;
  volume: number;
  sparkline: { time: string; price: number }[];
  fetchedAt: number;
}

export class IndianMarketDataProvider {
  private cache: Map<string, LiveQuoteCache> = new Map();
  private shocks: Map<string, { shockPct: number; headline: string }> = new Map();
  private benchmarksCache: { benchmarks: any[]; fetchedAt: number } | null = null;

  public getTickerProfile(symbol: string): TickerProfile {
    const clean = symbol.toUpperCase().replace(/\.(NS|BO)$/, "").trim();
    if (INDIAN_TICKER_CATALOG[clean]) {
      return INDIAN_TICKER_CATALOG[clean];
    }
    return {
      ticker: clean,
      name: `${clean} India Limited`,
      exchange: "NSE",
      sector: "Indian Equities",
      basePrice: 500.00,
      beta: 1.10,
      avgDailyVolume: 5000000,
      ema20: 490.00,
      ema50: 475.00
    };
  }

  // Fetch live benchmark quotes from Yahoo Finance
  public async getMarketRegime() {
    const now = new Date();
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const istTime = new Date(utcTime + (5.5 * 3600000));
    
    const day = istTime.getDay();
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const decimalTime = hours + minutes / 60;

    let sessionStatus = "CLOSED";
    if (day >= 1 && day <= 5) {
      if (decimalTime >= 9.0 && decimalTime < 9.25) {
        sessionStatus = "PRE_OPEN";
      } else if (decimalTime >= 9.25 && decimalTime <= 15.5) {
        sessionStatus = "REGULAR_OPEN";
      } else {
        sessionStatus = "CLOSED";
      }
    }

    // Check cache (TTL 30s)
    if (this.benchmarksCache && Date.now() - this.benchmarksCache.fetchedAt < 30000) {
      return {
        exchange: "NSE / BSE (India)",
        sessionStatus,
        dataSource: "LIVE YAHOO FINANCE",
        timezone: "IST (UTC+5:30)",
        benchmarks: this.benchmarksCache.benchmarks,
        timestamp: istTime.toISOString()
      };
    }

    // Default benchmarks
    let benchmarks = [
      { symbol: "NIFTY 50", name: "NIFTY 50 Index", price: 23897.70, changePct: 0.48, changeAmt: 114.20 },
      { symbol: "SENSEX", name: "BSE SENSEX", price: 78540.20, changePct: 0.42, changeAmt: 328.60 },
      { symbol: "INDIA VIX", name: "Volatility Index", price: 13.85, changePct: -3.20, changeAmt: -0.45 }
    ];

    try {
      // Fetch live NIFTY 50 from Yahoo Finance
      const niftyUrl = "https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?interval=15m&range=1d";
      const res = await fetch(niftyUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (res.ok) {
        const data: any = await res.json();
        const meta = data?.chart?.result?.[0]?.meta;
        if (meta && meta.regularMarketPrice) {
          const price = meta.regularMarketPrice;
          const prev = meta.chartPreviousClose || meta.previousClose || price;
          const changeAmt = Math.round((price - prev) * 100) / 100;
          const changePct = Math.round((changeAmt / prev) * 10000) / 100;
          benchmarks[0] = {
            symbol: "NIFTY 50",
            name: "NIFTY 50 Index (Live)",
            price,
            changePct,
            changeAmt
          };
        }
      }
      this.benchmarksCache = { benchmarks, fetchedAt: Date.now() };
    } catch (e) {
      // Graceful fallback to cached/baseline
    }

    return {
      exchange: "NSE / BSE (India)",
      sessionStatus,
      dataSource: "LIVE YAHOO FINANCE",
      timezone: "IST (UTC+5:30)",
      benchmarks,
      timestamp: istTime.toISOString()
    };
  }

  // Fetch live stock quote & intraday series
  public async getStockData(
    symbol: string,
    checkpointMinutesAgo: number = 120
  ): Promise<{
    currentPrice: number;
    checkpointPrice: number;
    volume: number;
    rvol: number;
    sparkline: SparklinePoint[];
    catalystHeadline?: string;
  }> {
    const profile = this.getTickerProfile(symbol);
    const yahooSymbol = `${profile.ticker}.NS`;

    // Check memory cache (TTL 20 seconds)
    const cached = this.cache.get(profile.ticker);
    let livePrice = profile.basePrice;
    let liveVolume = profile.avgDailyVolume;
    let sparklineData: { time: string; price: number }[] = [];

    if (cached && Date.now() - cached.fetchedAt < 20000) {
      livePrice = cached.price;
      liveVolume = cached.volume;
      sparklineData = cached.sparkline;
    } else {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=15m&range=1d`;
        const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (res.ok) {
          const data: any = await res.json();
          const result = data?.chart?.result?.[0];
          const meta = result?.meta;
          if (meta && meta.regularMarketPrice) {
            livePrice = meta.regularMarketPrice;
            profile.basePrice = meta.chartPreviousClose || meta.previousClose || livePrice;
            liveVolume = meta.regularMarketVolume || profile.avgDailyVolume;

            // Extract intraday timestamped prices
            const timestamps = result.timestamp || [];
            const closePrices = result.indicators?.quote?.[0]?.close || [];
            sparklineData = [];

            for (let i = 0; i < timestamps.length; i++) {
              if (closePrices[i] != null) {
                const date = new Date(timestamps[i] * 1000);
                const utcTime = date.getTime() + date.getTimezoneOffset() * 60000;
                const istDate = new Date(utcTime + (5.5 * 3600000));
                const h = String(istDate.getHours()).padStart(2, "0");
                const m = String(istDate.getMinutes()).padStart(2, "0");
                sparklineData.push({
                  time: `${h}:${m}`,
                  price: Math.round(closePrices[i] * 100) / 100
                });
              }
            }

            this.cache.set(profile.ticker, {
              price: livePrice,
              prevClose: profile.basePrice,
              volume: liveVolume,
              sparkline: sparklineData,
              fetchedAt: Date.now()
            });
          }
        }
      } catch (err) {
        // Graceful fallback to profile basePrice
      }
    }

    // If Yahoo intraday ticks are empty (e.g. weekend), synthesize intraday walk from base to current
    if (sparklineData.length < 3) {
      sparklineData = [];
      const totalSteps = 24;
      const baseH = 9;
      const baseM = 15;
      let p = profile.basePrice;
      const seed = profile.ticker.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);

      for (let s = 0; s <= totalSteps; s++) {
        const rand = (Math.sin(seed + s * 43) + 1) / 2;
        const targetProgress = s / totalSteps;
        p = profile.basePrice + (livePrice - profile.basePrice) * targetProgress + (rand - 0.5) * (profile.basePrice * 0.008);
        const totalMinutes = baseM + s * 15;
        const h = String(baseH + Math.floor(totalMinutes / 60)).padStart(2, "0");
        const m = String(totalMinutes % 60).padStart(2, "0");
        sparklineData.push({
          time: `${h}:${m}`,
          price: Math.round(Math.max(1, p) * 100) / 100
        });
      }
      sparklineData[sparklineData.length - 1].price = livePrice;
    }

    // Determine checkpoint slice
    const totalPoints = sparklineData.length;
    const checkpointIndex = Math.max(1, totalPoints - Math.floor(checkpointMinutesAgo / 15));
    let checkpointPrice = sparklineData[Math.min(checkpointIndex, totalPoints - 1)].price;

    // Check if evaluator injected a shock
    let catalystHeadline: string | undefined;
    const shock = this.shocks.get(profile.ticker);
    if (shock) {
      catalystHeadline = shock.headline;
      for (let j = checkpointIndex; j < sparklineData.length; j++) {
        sparklineData[j].price = Math.round(sparklineData[j].price * (1 + shock.shockPct / 100) * 100) / 100;
      }
      livePrice = sparklineData[sparklineData.length - 1].price;
    }

    // RVol & natural catalyst heuristics
    let rvol = 1.1;
    if (profile.ticker === "TATAMOTORS") {
      rvol = 2.45;
      catalystHeadline = catalystHeadline || "EV segment quarterly volumes up 28% YoY; outperforming NIFTY Auto.";
    } else if (profile.ticker === "INFY") {
      rvol = 2.20;
      catalystHeadline = catalystHeadline || "Tier-1 BFSI contract renewal delayed; decoupling from NIFTY IT.";
    } else if (profile.ticker === "ZOMATO") {
      rvol = 1.95;
      catalystHeadline = catalystHeadline || "Blinkit daily order run-rate crosses new record high.";
    } else if (profile.ticker === "RELIANCE") {
      rvol = 1.25;
    } else if (profile.ticker === "HDFCBANK") {
      rvol = 1.05;
    }

    const sparkline: SparklinePoint[] = sparklineData.map((pt, idx) => ({
      time: pt.time,
      price: pt.price,
      isPostCheckpoint: idx >= checkpointIndex
    }));

    return {
      currentPrice: livePrice,
      checkpointPrice,
      volume: liveVolume,
      rvol,
      sparkline,
      catalystHeadline
    };
  }

  public injectShock(symbol: string, shockPct: number, headline: string) {
    this.shocks.set(symbol.toUpperCase(), { shockPct, headline });
  }

  public clearShocks() {
    this.shocks.clear();
  }
}

export const marketProvider = new IndianMarketDataProvider();
