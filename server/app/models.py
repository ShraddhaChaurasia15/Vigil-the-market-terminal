from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field
import datetime

class AttentionTier(str, Enum):
    URGENT = "URGENT"
    DEVELOPING = "DEVELOPING"
    QUIET = "QUIET"

class DeltaFactorType(str, Enum):
    BETA_DIVERGENCE = "BETA_DIVERGENCE"
    VOLUME_ANOMALY = "VOLUME_ANOMALY"
    ATR_EXPANSION = "ATR_EXPANSION"
    LEVEL_CROSS = "LEVEL_CROSS"
    CATALYST_NEWS = "CATALYST_NEWS"
    ALERT_TRIGGER = "ALERT_TRIGGER"

class DeltaFactor(BaseModel):
    factor_type: DeltaFactorType
    label: str
    description: str
    severity: str  # "CRITICAL", "WARNING", "INFO"
    score_contribution: float

class SparklinePoint(BaseModel):
    time: str
    price: float
    is_post_checkpoint: bool

class TickerDelta(BaseModel):
    ticker: str
    company_name: str
    sector: str
    current_price: float
    today_change_pct: float
    today_change_amt: float
    
    # Stateful Checkpoint Metrics
    checkpoint_price: float
    delta_since_checkpoint_amt: float
    delta_since_checkpoint_pct: float
    
    # Underlying Analytical Metrics
    beta: float
    rvol: float
    atr14: float
    day_high: float
    day_low: float
    volume: int
    avg_volume: int
    
    # Meaningful Change Scoring
    delta_score: float  # 0 to 100
    attention_tier: AttentionTier
    delta_factors: List[DeltaFactor]
    sparkline: List[SparklinePoint]
    
    # Optional user notes / targets
    notes: Optional[str] = None
    target_price: Optional[float] = None
    stop_price: Optional[float] = None
    last_updated: str

class BenchmarkQuote(BaseModel):
    symbol: str
    name: str
    price: float
    change_pct: float

class MarketRegime(BaseModel):
    status: str  # "REGULAR_OPEN", "PRE_MARKET", "AFTER_HOURS", "CLOSED", "SIMULATED"
    data_freshness: str  # "REALTIME", "DELAYED_15M", "STALE_FALLBACK", "SIMULATED"
    circuit_breaker_active: bool
    benchmarks: List[BenchmarkQuote]
    timestamp: str

class ExecutiveFeedItem(BaseModel):
    id: str
    ticker: str
    headline: str
    detail: str
    tier: AttentionTier
    factor_tag: str
    timestamp: str

class CheckpointInfo(BaseModel):
    id: str
    checkpoint_time: str
    elapsed_human: str
    label: str
    total_tickers_tracked: int
    urgent_count: int
    developing_count: int
    quiet_count: int

class WatchlistDetail(BaseModel):
    id: str
    name: str
    description: str
    checkpoint: CheckpointInfo
    executive_feed: List[ExecutiveFeedItem]
    tickers: List[TickerDelta]

class WatchlistSummary(BaseModel):
    id: str
    name: str
    description: str
    ticker_count: int
    is_default: bool
    created_at: str

class CreateWatchlistRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    tickers: Optional[List[str]] = []

class AddTickerRequest(BaseModel):
    ticker: str
    notes: Optional[str] = None
    target_price: Optional[float] = None
    stop_price: Optional[float] = None

class AcknowledgeCheckpointRequest(BaseModel):
    label: Optional[str] = "Checked by User"

class SimulateCheckpointRequest(BaseModel):
    preset: str  # "30M_AGO", "2H_AGO", "MARKET_OPEN", "YESTERDAY_CLOSE"
    custom_minutes_ago: Optional[int] = None

class VolatilityShockRequest(BaseModel):
    ticker: str
    shock_pct: float  # e.g., -4.5 or +5.2
    catalyst_headline: str
