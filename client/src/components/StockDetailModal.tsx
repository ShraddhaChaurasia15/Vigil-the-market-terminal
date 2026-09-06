import React, { useState } from "react";
import { X, TrendingUp, TrendingDown, Target, ShieldAlert, Sparkles, Activity, Save } from "lucide-react";
import { TickerData } from "../types";

interface StockDetailModalProps {
  ticker: TickerData | null;
  isOpen: boolean;
  onClose: () => void;
  onSavePosition: (ticker: string, notes?: string, target?: number, stop?: number) => Promise<void>;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({
  ticker,
  isOpen,
  onClose,
  onSavePosition
}) => {
  if (!isOpen || !ticker) return null;

  const [target, setTarget] = useState(ticker.targetPrice ? String(ticker.targetPrice) : "");
  const [stop, setStop] = useState(ticker.stopPrice ? String(ticker.stopPrice) : "");
  const [notes, setNotes] = useState(ticker.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isPositiveDay = ticker.todayChangePct >= 0;
  const isPositiveDelta = ticker.deltaSinceCheckpointPct >= 0;

  // Calculate Risk / Reward Ratio
  const currentP = ticker.currentPrice;
  const targetP = parseFloat(target);
  const stopP = parseFloat(stop);
  let rrRatio: string | null = null;
  if (!isNaN(targetP) && !isNaN(stopP) && targetP > currentP && stopP < currentP) {
    const risk = currentP - stopP;
    const reward = targetP - currentP;
    if (risk > 0) {
      rrRatio = `1 : ${(reward / risk).toFixed(2)}`;
    }
  }

  // 52-Week Range Percentage
  let range52Pct = 50;
  if (ticker.high52 && ticker.low52 && ticker.high52 > ticker.low52) {
    range52Pct = Math.min(100, Math.max(0, ((currentP - ticker.low52) / (ticker.high52 - ticker.low52)) * 100));
  }

  // Day Range Percentage
  let dayRangePct = 50;
  if (ticker.dayHigh && ticker.dayLow && ticker.dayHigh > ticker.dayLow) {
    dayRangePct = Math.min(100, Math.max(0, ((currentP - ticker.dayLow) / (ticker.dayHigh - ticker.dayLow)) * 100));
  }

  // Intraday SVG chart
  const sparkline = ticker.sparkline || [];
  const prices = sparkline.map(p => p.price);
  const minP = Math.min(...prices, currentP);
  const maxP = Math.max(...prices, currentP);
  const pRange = maxP - minP || 1;
  const chartW = 540;
  const chartH = 120;

  const pathCoords = sparkline.map((p, i) => {
    const x = (i / Math.max(1, sparkline.length - 1)) * chartW;
    const y = chartH - ((p.price - minP) / pRange) * (chartH - 16) - 8;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const pathD = `M ${pathCoords.join(" L ")}`;

  const checkpointIdx = sparkline.findIndex(p => p.isPostCheckpoint);
  const checkpointX = checkpointIdx >= 0 ? (checkpointIdx / Math.max(1, sparkline.length - 1)) * chartW : -10;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSavePosition(
        ticker.ticker,
        notes.trim(),
        target ? parseFloat(target) : undefined,
        stop ? parseFloat(stop) : undefined
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0f1118] border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-start justify-between bg-zinc-900/40">
          <div>
            <div className="flex items-center space-x-2.5 font-mono">
              <span className="text-xl font-bold text-white tracking-tight">{ticker.ticker}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">
                {ticker.exchange}
              </span>
              <span className="text-xs text-zinc-400 font-sans">• {ticker.sector}</span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">{ticker.name}</p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right font-mono">
              <div className="text-lg font-bold text-white">
                ₹{ticker.currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div
                className={`text-xs font-semibold flex items-center justify-end space-x-0.5 ${
                  isPositiveDay ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {isPositiveDay ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>
                  {isPositiveDay ? "+" : ""}{ticker.todayChangePct.toFixed(2)}% (₹{ticker.todayChangeAmt.toFixed(2)})
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Hero: Delta Since Checkpoint */}
          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between font-mono text-xs">
            <div>
              <span className="text-zinc-400 block text-[11px]">Since You Last Checked</span>
              <span className="text-zinc-200 font-semibold">
                Baseline: ₹{ticker.checkpointPrice.toLocaleString("en-IN")}
              </span>
            </div>
            <div
              className={`px-3 py-1.5 rounded-lg border font-bold text-sm ${
                isPositiveDelta
                  ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-300"
                  : "bg-rose-950/40 border-rose-800/50 text-rose-300"
              }`}
            >
              <span>
                {isPositiveDelta && ticker.deltaSinceCheckpointAmt > 0 ? "+" : ""}
                {ticker.deltaSinceCheckpointPct.toFixed(2)}%
              </span>
              <span className="text-[11px] opacity-80 ml-1">
                ({isPositiveDelta && ticker.deltaSinceCheckpointAmt > 0 ? "+" : ""}₹{ticker.deltaSinceCheckpointAmt.toFixed(2)})
              </span>
            </div>
          </div>

          {/* Intraday Chart with Checkpoint Marker */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-1.5">
              <span>Intraday Trajectory (09:15 to Now)</span>
              <span className="text-amber-400 text-[11px] flex items-center gap-1">
                <span className="w-2 h-2 border border-amber-400 border-dashed rounded-full"></span>
                Dashed Line = Your Checkpoint
              </span>
            </div>
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3">
              <svg width="100%" height={chartH} viewBox={`0 0 ${chartW} ${chartH}`} className="overflow-visible">
                {checkpointX >= 0 && (
                  <g>
                    <line
                      x1={checkpointX}
                      y1={0}
                      x2={checkpointX}
                      y2={chartH}
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="3 3"
                    />
                    <text x={checkpointX + 4} y={15} fill="#f59e0b" fontSize={10} fontFamily="monospace">
                      You Were Here
                    </text>
                  </g>
                )}
                <path
                  d={pathD}
                  fill="none"
                  stroke={isPositiveDay ? "#34d399" : "#f43f5e"}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                <span>09:15 IST (Open)</span>
                <span>Low: ₹{minP.toFixed(2)}</span>
                <span>High: ₹{maxP.toFixed(2)}</span>
                <span>Current</span>
              </div>
            </div>
          </div>

          {/* Technical Telemetry Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 block uppercase">VWAP Anchor</span>
              <span className="text-white font-semibold">
                ₹{ticker.vwap ? ticker.vwap.toFixed(2) : "--"}
              </span>
              {ticker.vwapDistancePct != null && (
                <span className={`block text-[10px] ${ticker.vwapDistancePct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {ticker.vwapDistancePct >= 0 ? "+" : ""}{ticker.vwapDistancePct.toFixed(2)}% vs VWAP
                </span>
              )}
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 block uppercase">Volume Pacing</span>
              <span className="text-white font-semibold">{ticker.formattedVolume}</span>
              <span className="block text-[10px] text-orange-400">
                {ticker.rvol.toFixed(1)}x Normal Pacing
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 block uppercase">Pivot Point</span>
              <span className="text-white font-semibold">
                ₹{ticker.pivot ? ticker.pivot.toFixed(2) : "--"}
              </span>
              <span className="block text-[10px] text-zinc-400">
                R1: ₹{ticker.r1 ? ticker.r1.toFixed(0) : "--"} | S1: ₹{ticker.s1 ? ticker.s1.toFixed(0) : "--"}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 block uppercase">Moving Averages</span>
              <span className="text-white font-semibold">
                20 EMA: ₹{ticker.ema20 || "--"}
              </span>
              <span className="block text-[10px] text-zinc-400">
                50 EMA: ₹{ticker.ema50 || "--"}
              </span>
            </div>
          </div>

          {/* Ranges Visual Sliders */}
          <div className="space-y-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs font-mono">
            {/* Day Range */}
            <div>
              <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                <span>Day Low: ₹{ticker.dayLow?.toFixed(2)}</span>
                <span className="text-white font-bold">Today's Range</span>
                <span>Day High: ₹{ticker.dayHigh?.toFixed(2)}</span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden relative">
                <div
                  className="bg-orange-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${dayRangePct}%` }}
                ></div>
              </div>
            </div>

            {/* 52-Week Range */}
            {ticker.high52 && ticker.low52 && (
              <div>
                <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                  <span>52W L: ₹{ticker.low52.toFixed(2)}</span>
                  <span className="text-white font-bold">52-Week Range ({range52Pct.toFixed(0)}%)</span>
                  <span>52W H: ₹{ticker.high52.toFixed(2)}</span>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden relative">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${range52Pct}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Active Meaningful Change Drivers */}
          {ticker.factors.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-orange-400" />
                <span>Meaningful Change Drivers ({ticker.factors.length})</span>
              </h4>
              <div className="space-y-2">
                {ticker.factors.map((f, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-lg border text-xs ${
                      f.severity === "CRITICAL"
                        ? "bg-rose-950/20 border-rose-800/40 text-rose-200"
                        : "bg-amber-950/20 border-amber-800/40 text-amber-200"
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>{f.label}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900/80 font-mono">
                        {f.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Catalyst Note */}
          {ticker.catalystHeadline && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Breaking Catalyst</span>
                <span>{ticker.catalystHeadline}</span>
              </div>
            </div>
          )}

          {/* Position Management & Risk Calculator */}
          <form onSubmit={handleSave} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
            <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-400" />
              <span>Position Risk & Target Configuration</span>
            </h4>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Target Price (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="e.g. 1450"
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Stop Loss (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={stop}
                  onChange={(e) => setStop(e.target.value)}
                  placeholder="e.g. 1280"
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-mono focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {rrRatio && (
              <div className="p-2 rounded bg-zinc-950 text-xs font-mono text-emerald-400 flex items-center justify-between border border-zinc-800">
                <span>Calculated Risk/Reward:</span>
                <span className="font-bold">{rrRatio}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">Thesis / Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Breakout above 20 EMA with rising delivery volume"
                className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              {saveSuccess ? (
                <span className="text-xs text-emerald-400 font-mono">Position rules saved!</span>
              ) : (
                <span></span>
              )}
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? "Saving..." : "Save Position Rules"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

