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

Normal watchlists are walls of blinking numbers that force you to mentally recalculate everything. I built Vigil to act like a simple check-in: **it remembers where your stocks were when you last looked, highlights what moved while you were away, and lets you ignore the rest.**

---

## What it does

- **Tracks what changed while you were gone**: Remembers prices when you open the tab. When you return after an hour, it shows how much each stock moved during that hour, instead of comparing to yesterday's close.
- **Flags real moves, ignores the rest**: Instead of blinking every second for a 0.1% tick, it only highlights a stock if it moved more than 2%, moved against the Nifty trend, or saw unusually heavy trading volume.
- **Sorts by priority**: Stocks that actually need a look sit at the top so you don't have to scan the whole table.
- **One-click reset**: Click "Mark as Reviewed" to set your checkpoint to now and reset changes back to zero.
- **Stock details on click**: Click any stock to see its intraday chart, VWAP, day range, and set your target and stop-loss.
- **Test buttons**: Since Indian markets close at 3:30 PM, there are quick buttons to simulate stepping away for 30m or 2h so anyone can test it anytime.

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
