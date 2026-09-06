import React from "react";
import { TrendingUp, RefreshCw, Plus, ShieldCheck, Activity } from "lucide-react";
import { MarketRegime, WatchlistSummary } from "../types";

interface HeaderProps {
  marketRegime: MarketRegime | null;
  watchlists: WatchlistSummary[];
  selectedWatchlistId: string;
  onSelectWatchlist: (id: string) => void;
  onOpenCreateModal: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  marketRegime,
  watchlists,
  selectedWatchlistId,
  onSelectWatchlist,
  onOpenCreateModal,
  onRefresh,
  isRefreshing
}) => {
  return (
    <header className="border-b border-zinc-800/80 bg-[#0c0e14]/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar: Brand + Market Status + Watchlist Switcher */}
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Activity className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white font-mono">VIGIL</span>
                <span className="text-xs px-1.5 py-0.5 rounded font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 tracking-wider">
                  NSE • BSE
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">Smart Market Delta Watchlist</p>
            </div>
          </div>

          {/* Watchlist selector & actions */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1">
              <select
                value={selectedWatchlistId}
                onChange={(e) => onSelectWatchlist(e.target.value)}
                className="bg-transparent text-sm text-zinc-200 font-medium px-2.5 py-1 focus:outline-none cursor-pointer"
              >
                {watchlists.map((wl) => (
                  <option key={wl.id} value={wl.id} className="bg-zinc-900 text-zinc-200">
                    {wl.name} ({wl.ticker_count || 0})
                  </option>
                ))}
              </select>
              <button
                onClick={onOpenCreateModal}
                title="Create Watchlist"
                className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`p-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 transition ${
                isRefreshing ? "opacity-50 cursor-not-allowed" : ""
              }`}
              title="Refresh Quotes"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-orange-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Benchmarks Strip (NIFTY 50, SENSEX, INDIA VIX) */}
        {marketRegime && (
          <div className="flex items-center space-x-6 py-2.5 border-t border-zinc-800/40 text-xs overflow-x-auto">
            <div className="flex items-center space-x-1.5 text-zinc-400 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium">{marketRegime.sessionStatus.replace("_", " ")}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-500 font-mono">IST (UTC+5:30)</span>
            </div>

            <div className="h-3 w-px bg-zinc-800"></div>

            {marketRegime.benchmarks.map((b) => (
              <div key={b.symbol} className="flex items-center space-x-2 whitespace-nowrap font-mono">
                <span className="text-zinc-400 font-medium">{b.symbol}:</span>
                <span className="text-zinc-200 font-semibold">₹{b.price.toLocaleString("en-IN")}</span>
                <span
                  className={`flex items-center font-semibold text-[11px] ${
                    b.changePct >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {b.changePct >= 0 ? "+" : ""}
                  {b.changePct.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};
