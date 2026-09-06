import React, { useState } from "react";
import { X, Plus, Search } from "lucide-react";

interface AddTickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  
  onAdd: (ticker: string, notes?: string, target?: number, stop?: number) => Promise<void>;
}

const POPULAR_INDIAN_STOCKS = [
  "SBIN", "MARUTI", "LT", "BAJFINANCE", "TITAN", "SUNPHARMA", "ADANIENT", "COALINDIA", "WIPRO"
];

export const AddTickerModal: React.FC<AddTickerModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [symbol, setSymbol] = useState("");
  const [notes, setNotes] = useState("");
  const [target, setTarget] = useState("");
  const [stop, setStop] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim()) return;
    setIsSubmitting(true);
    setError("");

    try {
      await onAdd(
        symbol.trim().toUpperCase(),
        notes.trim(),
        target ? parseFloat(target) : undefined,
        stop ? parseFloat(stop) : undefined
      );
      setSymbol("");
      setNotes("");
      setTarget("");
      setStop("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add stock");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#12141c] border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Add Stock to Watchlist
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 font-mono mb-1.5">
              NSE / BSE Ticker Symbol
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. SBIN, MARUTI, LT"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                required
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-orange-500 transition uppercase"
              />
            </div>

            {/* Quick Suggestions */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {POPULAR_INDIAN_STOCKS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSymbol(s)}
                  className="px-2 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-[11px] font-mono transition"
                >
                  +{s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 font-mono mb-1">
                Target Objective (₹)
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 850"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-orange-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 font-mono mb-1">
                Stop Loss (₹)
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 780"
                value={stop}
                onChange={(e) => setStop(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-orange-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 font-mono mb-1">
              Position Thesis / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Breakout retest on weekly chart"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500 transition"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? "Adding..." : "Add to Watchlist"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
