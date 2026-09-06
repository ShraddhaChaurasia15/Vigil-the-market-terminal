# Vigil

A market watchlist for Indian equities (NSE & BSE) that tracks what actually changed while you were away from your screen.

---

## Why I Built This

During market hours (09:15 to 15:30 IST), I usually keep a watchlist tab open. But whenever I step away for a meeting or lunch and come back, I run into the same problem with standard platforms:

They only show percentage changes measured from yesterday's 3:30 PM close.

If Tata Motors is showing **+1.5%** today, that tells me nothing about what happened in the 45 minutes I was away:
- Did it spike at market open and drift flat?
- Did it just drop sharply on huge volume 10 minutes ago?
- Did it move on its own news, or was it just carried by a general Nifty rally?

Normal watchlists are walls of blinking numbers that force you to mentally recalculate everything. I built Vigil to act like a smart check-in: **it remembers where your stocks were when you last looked, highlights what moved while you were away, and lets you ignore the rest.**

---

## How It Works

1. **Session Checkpoints ("Since You Last Checked")**: When you open Vigil, it snapshots current prices and notes the time. When you return, it calculates the difference from that exact moment instead of yesterday's close.
2. **Filters the Noise**: A stock gets flagged only if something notable happened:
   - **Sharp swing**: Moved more than 2% since your checkpoint.
   - **Nifty decoupling**: Moving opposite to the Nifty 50 trend.
   - **Volume spike**: Trading pace is over 1.5x normal for this time of day.
   - **Target / Stop hit**: Crossed your custom target or stop-loss.
3. **Organized by Attention**: Stocks sort automatically into **Urgent**, **Developing**, and **Steady** so you immediately know where to look.
4. **"Mark as Reviewed"**: One click updates your checkpoint to the present, resets all relative changes to zero, and gets you ready for your next check-in.
5. **Stock Deep-Dive**: Clicking any stock shows its intraday chart (with a line showing when you left), VWAP, pivot points, and a live Risk/Reward calculator for your targets.
6. **Time Scrubber**: Quick buttons (30m ago, 2h ago, Market Open) to test the change detection even when Indian markets are closed.

---

## Quickstart

```bash
# Install
npm run install:all

# Run
npm run build
npm start
```
Open [http://localhost:5000](http://localhost:5000) in your browser.

---

## Tech Stack

React, TypeScript, Node.js, Express, SQLite.

---

## Author

**Shraddha Chaurasia** ([@ShraddhaChaurasia15](https://github.com/ShraddhaChaurasia15))
