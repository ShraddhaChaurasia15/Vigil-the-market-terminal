import React from "react";
import { History, Zap, RotateCcw, Sliders } from "lucide-react";

interface TimeMachineScrubberProps {
  onSimulate: (preset: string) => void;
  onInjectShock: (ticker: string, shockPct: number, headline: string) => void;
  onResetSimulation: () => void;
  isLoading: boolean;
}

export const TimeMachineScrubber: React.FC<TimeMachineScrubberProps> = ({
  onSimulate,
  onInjectShock,
  onResetSimulation,
  isLoading
}) => {
  return (
    <div className="bg-[#12141c] border border-zinc-800 rounded-xl p-4 mb-6 shadow-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Absence Simulator */}
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
            <History className="w-4 h-4 text-orange-400" />
            <span>Time-Travel Scrubber (Evaluator Simulation)</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Simulate stepping away to observe how Vigil identifies meaningful divergences over time:
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onSimulate("30M_AGO")}
            disabled={isLoading}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700/80 hover:border-zinc-500 text-zinc-300 hover:text-white text-xs font-mono transition"
          >
            30m Ago
          </button>
          <button
            onClick={() => onSimulate("2H_AGO")}
            disabled={isLoading}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700/80 hover:border-zinc-500 text-zinc-300 hover:text-white text-xs font-mono transition"
          >
            2h Ago
          </button>
          <button
            onClick={() => onSimulate("MARKET_OPEN")}
            disabled={isLoading}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700/80 hover:border-zinc-500 text-zinc-300 hover:text-white text-xs font-mono transition"
          >
            Market Open (09:15)
          </button>
          <button
            onClick={() => onSimulate("YESTERDAY_CLOSE")}
            disabled={isLoading}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700/80 hover:border-zinc-500 text-zinc-300 hover:text-white text-xs font-mono transition"
          >
            Yesterday Close
          </button>

          <div className="h-4 w-px bg-zinc-800 hidden sm:block"></div>

          {/* Quick Catalyst Injections */}
          <button
            onClick={() =>
              onInjectShock(
                "TATAMOTORS",
                4.5,
                "EV monthly retail registrations spike 42% MoM; institutional buying surge."
              )
            }
            disabled={isLoading}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-700/50 hover:bg-emerald-900/50 text-emerald-300 text-xs font-mono transition flex items-center gap-1"
            title="Inject +4.5% surge into TATAMOTORS to see live reaction"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Test Rally (TATAMOTORS +4.5%)</span>
          </button>

          <button
            onClick={() =>
              onInjectShock(
                "INFY",
                -3.5,
                "Major global IT contract delayed; decoupling from NIFTY IT index."
              )
            }
            disabled={isLoading}
            className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 border border-rose-700/50 hover:bg-rose-900/50 text-rose-300 text-xs font-mono transition flex items-center gap-1"
            title="Inject -3.5% drop into INFY to see live divergence reaction"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Test Drop (INFY -3.5%)</span>
          </button>

          <button
            onClick={onResetSimulation}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            title="Reset simulated shocks"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

