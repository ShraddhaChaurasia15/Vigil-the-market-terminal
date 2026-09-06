# Vigil ? Smart Market Delta Watchlist (NSE & BSE Edition)

> **CODE 2026 Submission**: Build a smart market watchlist that helps users not just track stocks, but quickly understand what has **"meaningfully changed"** since they last checked, and what deserves their attention now.

---

## The Core Idea: Stateful Absence Awareness

Traditional financial watchlists are static ticker boards. They compare today's price against yesterday?s arbitrary 15:30 IST close. When you step away from your desk for an hour and return, knowing that a stock is "+0.8% today" doesn't answer:
- *Did it move while I was gone?*
- *Did it move because the broader Nifty index rallied, or is it decoupling on company-specific volume?*
- *What demands my attention right now versus what can be safely ignored?*

**Vigil** solves this by establishing a **Session Checkpoint Ledger**:
1. When you view your watchlist, Vigil snapshots your checkpoint time ($T_0$) and baseline prices.
2. When you return at $T_1$, Vigil computes **Differential Deltas** $(\Delta P \text{ in ?}, \Delta \%)$ specifically across your absence window.
3. Assets are sorted into **?? Urgent Attention**, **?? Developing Drift**, and **?? Steady**.
4. Once reviewed, click **"Mark as Reviewed"** to synchronize your baseline to the present moment.

---

## Key Features

- **Indian Market Focus**:
  - Native **? (INR)** currency formatting.
  - Natural Indian volume metrics in **Lakhs (L)** and **Crores (Cr)**.
  - Market benchmarks: **NIFTY 50** (`^NSEI`) and **BSE SENSEX** (`^BSESN`).
  - Standard IST session hours (09:15 AM to 03:30 PM IST).
- **The 3 Meaningful Change Rules**:
  - ? **Price Swing Threshold**: Stock moved $\ge \pm 2.0\%$ since your checkpoint.
  - ?? **Nifty 50 Decoupling**: Idiosyncratic alpha divergence ($> 1.5\%$ spread relative to expected Nifty beta move).
  - ?? **Volume Surge**: Volume pacing running $\ge 1.5\times$ historical volume.
- **Sparklines with Checkpoint Markers**:
  - Inline custom SVG sparklines display a vertical dashed line showing the exact minute you last checked.
- **Evaluator Time-Machine Scrubber**:
  - One-click simulation buttons (`[30m Ago]`, `[2h Ago]`, `[Market Open 09:15]`, `[Test Rally]`) allow judges to test and verify delta recalculation 24/7, even when Indian markets are closed.
- **Single-Service Cloud Deployment**:
  - The Node.js Express backend serves both the REST API and the compiled React static files, enabling 1-click deployment to **Render.com**, **Railway**, or **Docker** without CORS issues.

---

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Express, TypeScript (`tsx` for dev, `tsc` for production).
- **Database**: SQLite with Write-Ahead Logging (`WAL` mode) via `better-sqlite3`.
- **DevOps**: Docker, Docker Compose, `render.yaml` configuration.

---

## Quickstart (Local Development)

### Prerequisites
- Node.js v18+ (tested on Node v20/v22)
- npm v9+

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Build and Start
To run both backend and frontend concurrently with auto-reload:
```bash
npm run build
npm start
```
Open **http://localhost:5000** in your browser.

---

## Online Deployment in 3 Minutes (Render.com)

1. Push this repository to GitHub.
2. In [Render.com](https://render.com), create a **New Web Service** and select your repo.
3. Configure:
   - **Runtime**: `Node`
   - **Build Command**: `npm run install:all && npm run build`
   - **Start Command**: `npm start`
4. Click **Deploy Web Service**.
Your live URL will be ready at: `https://your-app-name.onrender.com`.

*(See [DEPLOYMENT.md](DEPLOYMENT.md) for full details).*

---

## Automated Unit Tests

Run the built-in Node test runner for change detection and volume formatting:
```bash
npm test
```
All tests verify Nifty divergence detection, volume pacing anomalies, and stop/target triggers.

---

## Architecture & Evaluation Dimensions

For a comprehensive explanation of how this solution addresses all 5 CODE 2026 hackathon dimensions (Engineering Depth, Product Interpretation, Resilience, Simplicity, and Originality), please refer to **[ARCHITECTURE.md](ARCHITECTURE.md)**.
