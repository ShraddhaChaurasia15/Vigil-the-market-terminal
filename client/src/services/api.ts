import { MarketRegime, WatchlistSummary, WatchlistDetail } from "../types";

const BASE_URL = "/api";

export const api = {
  async getMarketRegime(): Promise<MarketRegime> {
    const res = await fetch(`${BASE_URL}/market/regime`);
    if (!res.ok) throw new Error("Failed to fetch market regime");
    return res.json();
  },

  async getWatchlists(): Promise<WatchlistSummary[]> {
    const res = await fetch(`${BASE_URL}/watchlists`);
    if (!res.ok) throw new Error("Failed to fetch watchlists");
    return res.json();
  },

  async createWatchlist(name: string, description: string = ""): Promise<{ id: string }> {
    const res = await fetch(`${BASE_URL}/watchlists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description })
    });
    if (!res.ok) throw new Error("Failed to create watchlist");
    return res.json();
  },

  async getWatchlistDetail(id: string): Promise<WatchlistDetail> {
    const res = await fetch(`${BASE_URL}/watchlists/${id}`);
    if (!res.ok) throw new Error("Failed to fetch watchlist details");
    return res.json();
  },

  async addTicker(
    watchlistId: string,
    ticker: string,
    notes?: string,
    targetPrice?: number,
    stopPrice?: number
  ): Promise<{ status: string; ticker: string }> {
    const res = await fetch(`${BASE_URL}/watchlists/${watchlistId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker, notes, targetPrice, stopPrice })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed to add ticker" }));
      throw new Error(err.error || "Failed to add ticker");
    }
    return res.json();
  },

  async removeTicker(watchlistId: string, ticker: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/watchlists/${watchlistId}/items/${ticker}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to remove ticker");
  },

  async acknowledgeCheckpoint(label?: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/checkpoints/acknowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label })
    });
    if (!res.ok) throw new Error("Failed to acknowledge checkpoint");
  },

  async simulateCheckpoint(preset: string, customMinutesAgo?: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/checkpoints/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preset, customMinutesAgo })
    });
    if (!res.ok) throw new Error("Failed to simulate checkpoint");
  },

  async injectShock(ticker: string, shockPct: number, headline: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/simulate/shock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker, shockPct, headline })
    });
    if (!res.ok) throw new Error("Failed to inject shock");
  },

  async resetSimulation(): Promise<void> {
    const res = await fetch(`${BASE_URL}/simulate/reset`, {
      method: "POST"
    });
    if (!res.ok) throw new Error("Failed to reset simulation");
  }
};
