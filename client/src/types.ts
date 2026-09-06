export type AttentionTier = "URGENT" | "DEVELOPING" | "STEADY";

export interface DeltaFactor {
  type: "PRICE_SWING" | "NIFTY_DIVERGENCE" | "VOLUME_SURGE" | "LEVEL_BREACH" | "TARGET_STOP";
  label: string;
  description: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
}

export interface SparklinePoint {
  time: string;
  price: number;
  isPostCheckpoint: boolean;
}

export interface TickerData {
  ticker: string;
  name: string;
  exchange: "NSE" | "BSE";
  sector: string;
  currentPrice: number;
  todayChangeAmt: number;
  todayChangePct: number;
  checkpointPrice: number;
  deltaSinceCheckpointAmt: number;
  deltaSinceCheckpointPct: number;
  volume: number;
  formattedVolume: string;
  rvol: number;
  beta: number;
  isMeaningfulChange: boolean;
  attentionTier: AttentionTier;
  deltaScore: number;
  factors: DeltaFactor[];
  sparkline: SparklinePoint[];
  notes?: string;
  targetPrice?: number | null;
  stopPrice?: number | null;
  catalystHeadline?: string;
}

export interface CheckpointInfo {
  id: string;
  checkpointTime: string;
  elapsedHuman: string;
  label: string;
  totalTickers: number;
  urgentCount: number;
  developingCount: number;
  steadyCount: number;
}

export interface ExecutiveFeedItem {
  id: string;
  ticker: string;
  tier: AttentionTier;
  headline: string;
  detail: string;
  deltaPct: number;
  catalyst?: string;
}

export interface WatchlistDetail {
  id: string;
  name: string;
  description: string;
  checkpoint: CheckpointInfo;
  executiveFeed: ExecutiveFeedItem[];
  tickers: TickerData[];
}

export interface WatchlistSummary {
  id: string;
  name: string;
  description: string;
  is_default: number;
  created_at: string;
  ticker_count: number;
}

export interface Benchmark {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  changeAmt: number;
}

export interface MarketRegime {
  exchange: string;
  sessionStatus: string;
  timezone: string;
  benchmarks: Benchmark[];
  timestamp: string;
}
