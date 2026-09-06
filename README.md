# Vigil

A market watchlist for Indian equities (NSE & BSE) that tells you what actually changed while you were away from your screen.

---

## Why I Built This

During market hours (09:15 to 15:30 IST), I usually keep a watchlist tab open. But whenever I step away for a meeting or lunch and come back, I run into the same frustration with standard platforms like Zerodha or TradingView:

They only show percentage changes measured from yesterday's 3:30 PM close.

If Tata Motors is showing **+1.5%** today, that tells me nothing about what happened in the 45 minutes I was gone:
- Did it spike at market open and drift flat?
- Did it just drop sharply on huge volume 10 minutes ago?
- Did it move on its own company news, or was it just carried by a general Nifty rally?

Most watchlists are walls of blinking numbers that force you to mentally recalculate everything. I wanted something that acts like an assistant: **"Here is where things were when you last looked, here is what moved while you were away, and here is what you can safely ignore."**

That's why I built Vigil.

---

## What It Does

1. **Session Checkpoints ("Since You Last Checked")**  
   When you open Vigil, it records a snapshot of your watchlist prices and notes the timestamp. When you come back 20 minutes or 2 hours later, it calculates the difference from that moment - not yesterday's close.

2. **Cuts Out Routine Noise**  
   Instead of staring at 15 stocks fluctuating by 0.2%, Vigil flags a stock only when something notable happens:
   - **Sharp swing**: Price moved more than 2% since your checkpoint.
   - **Nifty decoupling**: The stock is moving in the opposite direction of the Nifty 50 trend.
   - **Volume spike**: Trading pace is running over 1.5x higher than normal for this time of day.
   - **Target / Stop hit**: Price crossed your custom target or stop-loss level.

3. **Attention Groups**  
   Stocks automatically organize into three groups:
   - **Urgent**: Needs a look right now (stop breach, sudden volume drop, decoupling).
   - **Developing**: Emerging trend or approaching an alert level.
   - **Steady**: Normal, routine fluctuations you don't need to stress over.

4. **"Mark as Reviewed"**  
   Once you look through the movers, you click one button. Your checkpoint moves to the present time, all relative changes reset to zero, and you start fresh for your next check-in.

5. **Deep-Dive Drawer on Click**  
   Clicking any stock opens a side drawer showing:
   - Full intraday chart with a vertical marker indicating exactly when you last checked.
   - VWAP price and how far the stock is trading above or below it.
   - Day High/Low and 52-Week High/Low range bars.
   - Pivot points (R1 resistance, S1 support).
   - An interactive Target & Stop-Loss input with automatic Risk/Reward calculation.

6. **Time-Travel Scrubber (For Testing)**  
   Because Indian markets are only open 09:15 to 15:30 IST on weekdays, I added quick buttons to simulate stepping away (30m ago, 2h ago, Market Open) or injecting test volatility. This lets anyone evaluate the change-detection logic at midnight or on a Sunday.

7. **One-Click CSV Export**  
   Export your watchlist, delta metrics, and prices straight to a spreadsheet file.

---

## Tech Stack & Architecture

I kept the stack simple, fast, and easy to run without needing complicated services or cloud setups.

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide icons.
- **Backend**: Node.js, Express, TypeScript.
- **Database**: SQLite (`better-sqlite3`) with WAL mode enabled. Stored as a single local file (`vigil_nse.db`), so it requires zero database configuration or background services.
- **Market Data**: Yahoo Finance API for live NSE quotes (`RELIANCE.NS`, `TATAMOTORS.NS`, `^NSEI`, etc.) with a 20-second in-memory cache to prevent rate-limiting. If markets are closed or the network drops, it falls back gracefully to recent closing data.
- **Deployment**: The Express backend serves the built React frontend directly from `client/dist`. Everything runs on a single port (5000) as one unified process, avoiding CORS issues and making it deployable on Render or Railway with a single command.

---

## Project Structure

```
vigil/
? client/              # React frontend (Vite + TypeScript)
?   ? src/
?   ?   ? components/  # Header, WatchlistTable, StockDetailModal, etc.
?   ?   ? services/    # Typed API client
?   ?   ? types.ts     # Data models & interfaces
?   ?   ? App.tsx      # Main dashboard state & polling
?   ? package.json
?
? server/              # Express backend (TypeScript + SQLite)
?   ? src/
?   ?   ? engine/      # Delta calculations, market data fetcher & cache
?   ?   ? routes/      # REST API endpoints (/api/watchlists, /api/market)
?   ?   ? db.ts        # SQLite database setup & seed data
?   ?   ? index.ts     # Express server setup & static file hosting
?   ? vigil_nse.db     # Local SQLite database file
?   ? package.json
?
? DEPLOYMENT.md        # Step-by-step guide to deploy online
? ARCHITECTURE.md      # Detailed engineering and trade-off notes
? package.json         # Root scripts
? render.yaml          # 1-click cloud config
```

---

## Running It Locally

### Requirements
- Node.js (v18 or higher)
- npm

### 1. Install dependencies
```bash
npm run install:all
```

### 2. Build and run
```bash
npm run build
npm start
```
Open [http://localhost:5000](http://localhost:5000) in your browser.

### 3. Run unit tests
```bash
npm test
```

---

## Deploying Online

The repository is configured for free deployment on **Render.com**:
1. Fork or push this repo to your GitHub account.
2. In Render, create a new **Web Service** and select this repository.
3. Build command: `npm run install:all && npm run build`
4. Start command: `npm start`

Detailed instructions are in [DEPLOYMENT.md](DEPLOYMENT.md).

---

## Author

**Shraddha Chaurasia**  
GitHub: [@ShraddhaChaurasia15](https://github.com/ShraddhaChaurasia15)
