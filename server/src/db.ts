import Database from "better-sqlite3";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const dbPath = path.resolve(process.cwd(), "vigil_nse.db");
const db = new Database(dbPath);

// Performance & Concurrency settings
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS watchlists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS watchlist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      watchlist_id TEXT NOT NULL,
      ticker TEXT NOT NULL,
      notes TEXT DEFAULT '',
      target_price REAL,
      stop_price REAL,
      added_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (watchlist_id) REFERENCES watchlists(id) ON DELETE CASCADE,
      UNIQUE(watchlist_id, ticker)
    );

    CREATE TABLE IF NOT EXISTS user_checkpoints (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      checkpoint_time TEXT NOT NULL,
      label TEXT DEFAULT 'Manual Checkpoint',
      is_active INTEGER DEFAULT 1
    );
  `);

  // Seed default Indian watchlist if none exists
  const checkStmt = db.prepare("SELECT COUNT(*) as count FROM watchlists WHERE is_default = 1");
  const result = checkStmt.get() as { count: number };

  if (result.count === 0) {
    const defaultWlId = "default-nifty-core";
    const insertWl = db.prepare(`
      INSERT INTO watchlists (id, name, description, is_default)
      VALUES (?, ?, ?, 1)
    `);
    insertWl.run(
      defaultWlId,
      "NIFTY 50 Core & Momentum Basket",
      "Premier Indian equities across Energy, IT, Banking, Auto, and Consumer Tech."
    );

    const defaultStocks = [
      { ticker: "RELIANCE", notes: "Energy, Jio, and Retail conglomerate", target: 3200, stop: 2850 },
      { ticker: "TCS", notes: "IT services and digital transformation leader", target: 4500, stop: 4000 },
      { ticker: "INFY", notes: "High beta IT exporter", target: 2050, stop: 1780 },
      { ticker: "HDFCBANK", notes: "Banking anchor and credit expansion", target: 1800, stop: 1550 },
      { ticker: "TATAMOTORS", notes: "Commercial vehicle & JLR momentum", target: 1200, stop: 980 },
      { ticker: "ZOMATO", notes: "High-beta Q-commerce & food delivery growth", target: 310, stop: 235 },
      { ticker: "ICICIBANK", notes: "Strong NIM expansion & corporate book", target: 1350, stop: 1150 },
      { ticker: "ITC", notes: "Defensive FMCG dividend compounder", target: 540, stop: 460 },
      { ticker: "BHARTIARTL", notes: "ARPU expansion & digital telecom infrastructure", target: 1720, stop: 1450 }
    ];

    const insertItem = db.prepare(`
      INSERT INTO watchlist_items (watchlist_id, ticker, notes, target_price, stop_price)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const stock of defaultStocks) {
      insertItem.run(defaultWlId, stock.ticker, stock.notes, stock.target, stock.stop);
    }

    // Seed initial checkpoint anchored 2 hours ago
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const insertCp = db.prepare(`
      INSERT INTO user_checkpoints (id, user_id, checkpoint_time, label, is_active)
      VALUES (?, 'default_user', ?, 'Initial Desk Checkpoint (2h ago)', 1)
    `);
    insertCp.run(uuidv4(), twoHoursAgo);

    console.log("Database initialized and seeded with NIFTY 50 Core Watchlist.");
  }
}

export default db;
