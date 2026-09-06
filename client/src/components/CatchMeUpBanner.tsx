import React from "react";
import { CheckCircle2, AlertTriangle, Info, Clock, BellRing, Sparkles } from "lucide-react";
import { CheckpointInfo, ExecutiveFeedItem } from "../types";

interface CatchMeUpBannerProps {
  checkpoint: CheckpointInfo;
  executiveFeed: ExecutiveFeedItem[];
  onAcknowledge: () => void;
  isAcknowledging: boolean;
}

export const CatchMeUpBanner: React.FC<CatchMeUpBannerProps> = ({
  checkpoint,
  executiveFeed,
  onAcknowledge,
  isAcknowledging
}) => {
  return (
    <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-xl relative overflow-hidden mb-6">
      {/* Subtle decorative glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded-md bg-orange-500/20 text-orange-400">
              <BellRing className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Since You Last Checked
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono font-normal">
                {checkpoint.elapsedHuman}
              </span>
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1 flex items-center space-x-2 font-mono">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>Checkpoint anchored: {checkpoint.label}</span>
          </p>
        </div>

        {/* Attention counters & Action Button */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-xs font-mono">
            {checkpoint.urgentCount > 0 && (
              <span className="px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                {checkpoint.urgentCount} Urgent
              </span>
            )}
            {checkpoint.developingCount > 0 && (
              <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold">
                {checkpoint.developingCount} Developing
              </span>
            )}
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
              {checkpoint.steadyCount} Steady
            </span>
          </div>

          <button
            onClick={onAcknowledge}
            disabled={isAcknowledging}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/30 transition active:scale-95 disabled:opacity-50"
            title="Update checkpoint to current time and reset relative deltas"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isAcknowledging ? "Syncing..." : "Mark as Reviewed"}</span>
          </button>
        </div>
      </div>

      {/* Executive Digest Feed */}
      {executiveFeed.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {executiveFeed.map((item) => {
            const isUrgent = item.tier === "URGENT";
            return (
              <div
                key={item.id}
                className={`p-3 rounded-lg border text-xs transition ${
                  isUrgent
                    ? "bg-rose-950/20 border-rose-900/40 hover:border-rose-700/60"
                    : "bg-amber-950/20 border-amber-900/40 hover:border-amber-700/60"
                }`}
              >
                <div className="flex items-center justify-between font-mono mb-1.5">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <span
                      className={`w-2 h-2 rounded-full ${isUrgent ? "bg-rose-500" : "bg-amber-500"}`}
                    ></span>
                    <span className="text-white">{item.ticker}</span>
                  </div>
                  <span
                    className={`font-semibold ${
                      item.deltaPct >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    Δ {item.deltaPct >= 0 ? "+" : ""}
                    {item.deltaPct.toFixed(2)}%
                  </span>
                </div>
                <p className="font-semibold text-zinc-200 line-clamp-1">{item.headline}</p>
                <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                  {item.detail}
                </p>
                {item.catalyst && (
                  <div className="mt-2 text-[10px] text-zinc-400 bg-zinc-900/60 p-1.5 rounded border border-zinc-800/60 flex items-start space-x-1">
                    <Sparkles className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{item.catalyst}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 text-center py-4 text-zinc-400 text-xs">
          <p>No anomalous divergences or volatility shocks detected since your last review. Portfolio is trading within steady limits.</p>
        </div>
      )}
    </div>
  );
};
