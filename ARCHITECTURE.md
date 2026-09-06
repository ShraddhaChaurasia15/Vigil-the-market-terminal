# Architecture & Engineering Notes

This document explains the technical decisions, data flow, and trade-offs behind Vigil.

---


## 1. The Core Problem

Most market watchlists make a flawed assumption: they assume users watch prices continuously.

In reality, most people check the market, close the tab, do focused work for an hour or two, and come back. When you return at 11:30 AM after opening the app at 09:30 AM:
- Standard tools calculate percentage change against yesterday's 15:30 close ($T_{-1}$).
- But what you actually care about is what happened between 09:30 AM ($T_0$) and 11:30 AM ($T_1$).

### The State Model
Vigil implements a **Checkpoint Ledger**:
1. When you load the watchlist, the server looks up your active checkpoint timestamp ($T_0$) and baseline price from SQLite.
2. The delta engine evaluates the difference:
   $$\Delta P = P(T_1) - P(T_0)$$
   $$\Delta \% = \frac{P(T_1) - P(T_0)}{P(T_0)} \times 100$$
3. When you finish reviewing, clicking "Mark as Reviewed" creates a new checkpoint record at $T_1$, resetting all deltas to zero for your next check-in.

---

## 2. Change Detection Logic

Instead of relying on LLMs that can hallucinate explanations or add API latency, Vigil uses deterministic rules grounded in trading mechanics:

### Rule 1: Price Swing Threshold
If a stock's price moves more than $\pm 2.0\%$ since the checkpoint, it triggers an alert. Normal intraday drift is typically under $0.5\%$, so moves $>2\%$ warrant immediate attention.

### Rule 2: Nifty 50 Decoupling (Beta-Adjusted Divergence)
A stock dropping $1\%$ when the Nifty 50 is down $1.2\%$ is usually just market beta. But if the Nifty is up $+0.5\%$ and a stock with $\beta = 1.2$ drops $-2.0\%$, that move is company-specific:
$$\text{Expected Move} = \beta \times \Delta r_{\text{Nifty}}$$
$$\text{Alpha Divergence} = \Delta r_{\text{stock}} - \text{Expected Move}$$
When $|\text{Alpha Divergence}| \ge 1.5\%$, it flags an idiosyncratic decoupling alert.

### Rule 3: Volume Pacing (Relative Volume)
Volume is compared against expected cumulative volume for the current time of day (following the standard Indian market intraday volume curve). Pacing running at $\ge 1.5\times$ normal indicates institutional order flow.

### Rule 4: Risk Boundaries
If the user set a custom Stop Loss or Target price, crossing either level immediately triggers a priority alert with risk-to-reward metrics.

---

## 3. Data Ingestion & Resilience

### Handling Real-World Market Conditions
1. **Market Hours Awareness**:
   Indian markets operate 09:15 to 15:30 IST on weekdays. Outside these hours, live feeds return static data. Vigil detects the IST session state and displays it clearly.
2. **Rate Limiting & Memory Cache**:
   Querying Yahoo Finance for 10+ stocks on every 12-second poll would quickly hit HTTP 429 rate limits. We implement an in-memory cache with a 20-second TTL. Multiple concurrent users or fast tab reloads hit memory instead of hammering external servers.
3. **Offline / Weekend Fallback**:
   If Yahoo Finance is unreachable or markets are closed, the engine falls back to previous consolidated session closes without crashing or returning empty arrays.
4. **Time Scrubber for Testing**:
   To let anyone test the delta calculation anytime (including weekends), the time scrubber allows shifting the checkpoint backward (30m ago, 2h ago, Market Open) or injecting sample price shocks.

---

## 4. Why This Architecture?

### Why SQLite with WAL Mode?
- **Zero setup**: Runs inside the Node process. No PostgreSQL server to install, no credentials to configure, no connection pool leaks.
- **Single file**: Database is stored as `vigil_nse.db`. It persists across server restarts and is easy to back up.
- **Write-Ahead Logging (WAL)**: Concurrently handles reads without blocking writes, giving sub-millisecond query latency.

### Why Single-Service Deployment?
Rather than splitting frontend and backend into two separate hosted services (which introduces CORS preflight latency, environment variable mismatches, and double hosting costs):
- The Express server serves both the `/api/*` routes and the production-built React static files (`client/dist`).
- Everything runs on a single port (`5000`).
- This can be deployed in 2 minutes on Render or Railway with a single `npm run build && npm start` command.

---

## 5. Directory Structure

```
server/
? src/
?   ? engine/
?   ?   ? deltaEngine.ts   # Pure functions for change detection & scoring
?   ?   ? marketData.ts    # Yahoo Finance client, cache, and ticker profiles
?   ? routes/
?   ?   ? api.ts           # REST endpoints
?   ? db.ts                # SQLite schema and query helpers
?   ? index.ts             # Express entrypoint
?   ? tests/
?       ? deltaEngine.test.ts # Unit tests for rules
? package.json
```

All business logic in `deltaEngine.ts` is pure and decoupled from HTTP or database layers, making it fast to unit test (`npm test`).
