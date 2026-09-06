import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { SectorTape } from "./components/SectorTape";
import { CatchMeUpBanner } from "./components/CatchMeUpBanner";
import { WatchlistTable } from "./components/WatchlistTable";
import { TimeMachineScrubber } from "./components/TimeMachineScrubber";
import { StockDetailModal } from "./components/StockDetailModal";
import { AddTickerModal } from "./components/AddTickerModal";
import { CreateWatchlistModal } from "./components/CreateWatchlistModal";
import { api } from "./services/api";
import { MarketRegime, WatchlistSummary, WatchlistDetail, TickerData } from "./types";
import { ShieldCheck } from "lucide-react";

export function App() {
  const [marketRegime, setMarketRegime] = useState<MarketRegime | null>(null);
  const [watchlists, setWatchlists] = useState<WatchlistSummary[]>([]);
  const [selectedWlId, setSelectedWlId] = useState<string>("");
  const [watchlistDetail, setWatchlistDetail] = useState<WatchlistDetail | null>(null);

  const [selectedStock, setSelectedStock] = useState<TickerData | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isAcknowledging, setIsAcknowledging] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "info" } | null>(null);

  const showNotification = (message: string, type: "success" | "info" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const loadInitial = useCallback(async () => {
    try {
      setIsLoading(true);
      const [regime, wls] = await Promise.all([
        api.getMarketRegime(),
        api.getWatchlists()
      ]);
      setMarketRegime(regime);
      setWatchlists(wls);

      if (wls.length > 0) {
        const defaultWl = wls.find((w) => w.is_default === 1) || wls[0];
        setSelectedWlId(defaultWl.id);
        const detail = await api.getWatchlistDetail(defaultWl.id);
        setWatchlistDetail(detail);
      }
    } catch (err) {
      console.error("Failed to load initial data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const refreshCurrent = useCallback(async () => {
    if (!selectedWlId) return;
    try {
      setIsRefreshing(true);
      const [regime, detail] = await Promise.all([
        api.getMarketRegime(),
        api.getWatchlistDetail(selectedWlId)
      ]);
      setMarketRegime(regime);
      setWatchlistDetail(detail);

      // Keep selected stock synced if drawer is open
      if (selectedStock) {
        const updated = detail.tickers.find(t => t.ticker === selectedStock.ticker);
        if (updated) setSelectedStock(updated);
      }
    } catch (err) {
      console.error("Failed to refresh watchlist:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedWlId, selectedStock]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshCurrent();
    }, 12000);
    return () => clearInterval(interval);
  }, [refreshCurrent]);

  const handleSelectWatchlist = async (id: string) => {
    setSelectedWlId(id);
    try {
      setIsRefreshing(true);
      const detail = await api.getWatchlistDetail(id);
      setWatchlistDetail(detail);
    } catch (err) {
      console.error("Failed to switch watchlist:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAcknowledge = async () => {
    try {
      setIsAcknowledging(true);
      await api.acknowledgeCheckpoint("Desk Checkpoint (Synchronized)");
      await refreshCurrent();
      showNotification("Checkpoint updated to present. Relative deltas synchronized to ₹0.00 baseline.");
    } catch (err) {
      console.error("Failed to acknowledge checkpoint:", err);
    } finally {
      setIsAcknowledging(false);
    }
  };

  const handleSimulate = async (preset: string) => {
    try {
      setIsRefreshing(true);
      await api.simulateCheckpoint(preset);
      await refreshCurrent();
      showNotification(`Simulated absence: ${preset.replace("_", " ")}`);
    } catch (err) {
      console.error("Failed to simulate checkpoint:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleInjectShock = async (ticker: string, shockPct: number, headline: string) => {
    try {
      setIsRefreshing(true);
      await api.injectShock(ticker, shockPct, headline);
      await refreshCurrent();
      showNotification(`Injected ${shockPct > 0 ? "+" : ""}${shockPct}% shock into ${ticker}`);
    } catch (err) {
      console.error("Failed to inject shock:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResetSimulation = async () => {
    try {
      setIsRefreshing(true);
      await api.resetSimulation();
      await refreshCurrent();
      showNotification("Reset all simulated shocks to baseline.", "info");
    } catch (err) {
      console.error("Failed to reset shocks:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddTicker = async (ticker: string, notes?: string, target?: number, stop?: number) => {
    if (!selectedWlId) return;
    await api.addTicker(selectedWlId, ticker, notes, target, stop);
    await refreshCurrent();
    const wls = await api.getWatchlists();
    setWatchlists(wls);
    showNotification(`Added ${ticker} to watchlist.`);
  };

  const handleRemoveTicker = async (ticker: string) => {
    if (!selectedWlId) return;
    await api.removeTicker(selectedWlId, ticker);
    if (selectedStock?.ticker === ticker) setSelectedStock(null);
    await refreshCurrent();
    const wls = await api.getWatchlists();
    setWatchlists(wls);
    showNotification(`Removed ${ticker} from watchlist.`, "info");
  };

  const handleCreateWatchlist = async (name: string, description?: string) => {
    const created = await api.createWatchlist(name, description);
    const wls = await api.getWatchlists();
    setWatchlists(wls);
    setSelectedWlId(created.id);
    const detail = await api.getWatchlistDetail(created.id);
    setWatchlistDetail(detail);
    showNotification(`Created watchlist: ${name}`);
  };

  const handleSavePosition = async (ticker: string, notes?: string, target?: number, stop?: number) => {
    if (!selectedWlId) return;
    await api.updateTicker(selectedWlId, ticker, notes, target, stop);
    await refreshCurrent();
    showNotification(`Saved target & stop rules for ${ticker}.`);
  };

  return (
    <div className="min-h-screen bg-[#090A0F] text-[#F1F5F9] flex flex-col font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-zinc-900 border border-zinc-700 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-mono animate-in fade-in slide-in-from-bottom-3 duration-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <Header
        marketRegime={marketRegime}
        watchlists={watchlists}
        selectedWatchlistId={selectedWlId}
        onSelectWatchlist={handleSelectWatchlist}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onRefresh={refreshCurrent}
        isRefreshing={isRefreshing}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs font-mono">Connecting to NSE / BSE Live Terminal & Checkpoints...</p>
          </div>
        ) : (
          <>
            {/* Sector Performance Tape & Market Breadth */}
            <SectorTape
              sectors={marketRegime?.sectors}
              breadth={marketRegime?.breadth}
              dataSource={marketRegime?.dataSource}
            />

            {/* Time-Machine Scrubber for Evaluators */}
            <TimeMachineScrubber
              onSimulate={handleSimulate}
              onInjectShock={handleInjectShock}
              onResetSimulation={handleResetSimulation}
              isLoading={isRefreshing}
            />

            {/* "Since You Last Checked" Executive Banner */}
            {watchlistDetail && (
              <CatchMeUpBanner
                checkpoint={watchlistDetail.checkpoint}
                executiveFeed={watchlistDetail.executiveFeed}
                onAcknowledge={handleAcknowledge}
                isAcknowledging={isAcknowledging}
              />
            )}

            {/* Watchlist Data Table (Click row to open Stock Detail Drawer) */}
            {watchlistDetail && (
              <WatchlistTable
                tickers={watchlistDetail.tickers}
                onRemoveTicker={handleRemoveTicker}
                onOpenAddModal={() => setIsAddModalOpen(true)}
                onSelectTicker={(t) => setSelectedStock(t)}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 py-4 text-center text-xs text-zinc-500 font-mono">
        <p>Vigil — State-Aware Market Delta Terminal for NSE & BSE Equities • Institutional Telemetry • CODE 2026</p>
      </footer>

      {/* Stock Technicals & Risk Drawer */}
      <StockDetailModal
        ticker={selectedStock}
        isOpen={Boolean(selectedStock)}
        onClose={() => setSelectedStock(null)}
        onSavePosition={handleSavePosition}
      />

      {/* Add Stock Modal */}
      <AddTickerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddTicker}
      />

      {/* Create Watchlist Modal */}
      <CreateWatchlistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateWatchlist}
      />
    </div>
  );
}

export default App;

