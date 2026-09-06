import React from "react";
import { Trash2, TrendingUp, TrendingDown, AlertCircle, Zap, Crosshair } from "lucide-react";
import { TickerData, SparklinePoint } from "../types";

interface WatchlistTableProps {
  tickers: TickerData[];
  onRemoveTicker: (ticker: string) => void;
  onOpenAddModal: () => void;
}

const MiniSparkline: React.FC<{ points: SparklinePoint[]; isPositive: boolean }> = ({ points, isPositive }) => {
  if (!points || points.length < 2) return <div className="w-24 h-8 bg-zinc-900 rounded"></div>;

  const prices = points.map(p => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const width = 110;
  const height = 32;

  // Build SVG path
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p.price - min) / range) * (height - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${coords.join(" L ")}`;

  // Find index where checkpoint occurred
  const checkpointIdx = points.findIndex(p => p.isPostCheckpoint);
  const checkpointX = checkpointIdx >= 0 ? (checkpointIdx / (points.length - 1)) * width : -10;

  const strokeColor = isPositive ? "#34d399" : "#f43f5e";

  return (
    <div className="relative w-[110px] h-[32px]">
      <svg width={width} height={height} className="overflow-visible">
        {/* Checkpoint boundary marker line */}
        {checkpointX >= 0 && (
          <line
            x1={checkpointX}
            y1={0}
            x2={checkpointX}
            y2={height}
            stroke="#f59e0b"
            strokeWidth={1.5}
            strokeDasharray="2 2"
          />
        )}
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export const WatchlistTable: React.FC<WatchlistTableProps> = ({
  tickers,
  onRemoveTicker,
  onOpenAddModal
}) => {
  return (
    <div className="bg-[#0e1017] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight font-mono uppercase">
            Active Watchlist Monitor
          </h3>
          <p className="text-xs text-zinc-400">
            Sorted by Attention Priority • Track changes relative to your checkpoint
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow transition active:scale-95 flex items-center gap-1.5"
        >
          <span>+ Add Stock</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400 font-mono bg-zinc-900/50">
              <th className="py-3 px-4">Instrument</th>
              <th className="py-3 px-4">Current Price</th>
              <th className="py-3 px-4">Day %</th>
              <th className="py-3 px-4 bg-zinc-900/80">Δ Since Checkpoint</th>
              <th className="py-3 px-4">Volume & Pacing</th>
              <th className="py-3 px-4">Meaningful Change Factors</th>
              <th className="py-3 px-4 text-center">Trend & Checkpoint</th>
              <th className="py-3 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-xs">
            {tickers.map((t) => {
              const isPositiveDay = t.todayChangePct >= 0;
              const isPositiveDelta = t.deltaSinceCheckpointPct >= 0;

              let tierBadge = null;
              if (t.attentionTier === "URGENT") {
                tierBadge = (
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block shadow-sm shadow-rose-500" title="Urgent Attention Required"></span>
                );
              } else if (t.attentionTier === "DEVELOPING") {
                tierBadge = (
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" title="Developing Movement"></span>
                );
              } else {
                tierBadge = (
                  <span className="w-2 h-2 rounded-full bg-emerald-500/50 inline-block" title="Steady"></span>
                );
              }

              return (
                <tr
                  key={t.ticker}
                  className={`hover:bg-zinc-900/40 transition group ${
                    t.attentionTier === "URGENT" ? "bg-rose-950/5" : ""
                  }`}
                >
                  {/* Symbol & Company */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2.5">
                      {tierBadge}
                      <div>
                        <div className="flex items-center space-x-1.5 font-mono">
                          <span className="font-bold text-white text-sm">{t.ticker}</span>
                          <span className="text-[10px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 font-semibold">
                            {t.exchange}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 max-w-[160px] truncate">{t.name}</p>
                      </div>
                    </div>
                  </td>

                  {/* Current Price */}
                  <td className="py-3.5 px-4 font-mono font-semibold text-white whitespace-nowrap">
                    ₹{t.currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>

                  {/* Day % */}
                  <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                    <span
                      className={`inline-flex items-center space-x-0.5 font-semibold ${
                        isPositiveDay ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isPositiveDay ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isPositiveDay ? "+" : ""}
                        {t.todayChangePct.toFixed(2)}%
                      </span>
                    </span>
                    <div className="text-[11px] text-zinc-500 font-mono">
                      {isPositiveDay ? "+" : ""}₹{t.todayChangeAmt.toFixed(2)}
                    </div>
                  </td>

                  {/* Δ Since Checkpoint (Hero Column) */}
                  <td className="py-3.5 px-4 font-mono whitespace-nowrap bg-zinc-900/40">
                    <div
                      className={`inline-block px-2.5 py-1 rounded-md font-bold text-xs border ${
                        Math.abs(t.deltaSinceCheckpointPct) < 0.1
                          ? "bg-zinc-800/40 border-zinc-700/50 text-zinc-300"
                          : isPositiveDelta
                          ? "bg-emerald-950/30 border-emerald-800/40 text-emerald-300"
                          : "bg-rose-950/30 border-rose-800/40 text-rose-300"
                      }`}
                    >
                      <span>
                        {isPositiveDelta && t.deltaSinceCheckpointAmt > 0 ? "+" : ""}
                        {t.deltaSinceCheckpointPct.toFixed(2)}%
                      </span>
                      <span className="text-[10px] opacity-80 block">
                        ({isPositiveDelta && t.deltaSinceCheckpointAmt > 0 ? "+" : ""}₹{t.deltaSinceCheckpointAmt.toFixed(2)})
                      </span>
                    </div>
                  </td>

                  {/* Volume & RVol */}
                  <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                    <div className="text-zinc-200 font-semibold">{t.formattedVolume}</div>
                    <div className="mt-0.5">
                      {t.rvol >= 1.5 ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold">
                          ⚡ {t.rvol.toFixed(1)}x Pacing
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-500">{t.rvol.toFixed(1)}x normal</span>
                      )}
                    </div>
                  </td>

                  {/* Meaningful Change Badges */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                      {t.factors.length > 0 ? (
                        t.factors.map((f, i) => (
                          <span
                            key={i}
                            className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                              f.severity === "CRITICAL"
                                ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                : f.severity === "WARNING"
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                            }`}
                            title={f.description}
                          >
                            {f.label}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-zinc-500 italic">Drifting in noise band</span>
                      )}

                      {/* Target / Stop indicator badges */}
                      {t.targetPrice && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                          Target: ₹{t.targetPrice}
                        </span>
                      )}
                      {t.stopPrice && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                          Stop: ₹{t.stopPrice}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Trend & Checkpoint Sparkline */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex flex-col items-center">
                      <MiniSparkline points={t.sparkline} isPositive={isPositiveDay} />
                      <span className="text-[9px] text-amber-500/80 font-mono mt-0.5">
                        | Checkpoint
                      </span>
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => onRemoveTicker(t.ticker)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800/80 rounded transition"
                      title="Remove from watchlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
