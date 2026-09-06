import React from "react";
import { SectorIndex, MarketBreadth } from "../types";
import { PieChart, Radio } from "lucide-react";

interface SectorTapeProps {
  sectors?: SectorIndex[];
  breadth?: MarketBreadth;
  dataSource?: string;
}

export const SectorTape: React.FC<SectorTapeProps> = ({ sectors, breadth, dataSource }) => {
  if (!sectors || sectors.length === 0) return null;

  return (
    <div className="bg-[#0e1017] border border-zinc-800/80 rounded-lg p-2.5 mb-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
      {/* Live Data Badge + Market Breadth */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5 font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold whitespace-nowrap">
          <Radio className="w-3 h-3 animate-pulse" />
          <span>{dataSource || "LIVE FEED"}</span>
        </div>

        {breadth && (
          <div className="flex items-center space-x-2 font-mono text-[11px] whitespace-nowrap">
            <span className="text-zinc-500">Market Breadth:</span>
            <span className="text-emerald-400 font-bold">{breadth.advances} Adv</span>
            <span className="text-zinc-600">/</span>
            <span className="text-rose-400 font-bold">{breadth.declines} Dec</span>
          </div>
        )}
      </div>

      {/* Sector chips */}
      <div className="flex items-center space-x-3 overflow-x-auto w-full md:w-auto font-mono text-[11px]">
        {sectors.map((sec) => {
          const isPos = sec.changePct >= 0;
          return (
            <div
              key={sec.symbol}
              className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800/80 whitespace-nowrap flex items-center space-x-1.5"
            >
              <span className="text-zinc-400 font-medium">{sec.name}:</span>
              <span className={`font-bold ${isPos ? "text-emerald-400" : "text-rose-400"}`}>
                {isPos ? "+" : ""}{sec.changePct.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

