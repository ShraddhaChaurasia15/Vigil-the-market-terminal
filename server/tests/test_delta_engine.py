import pytest
from app.engine.delta_calculator import calculate_delta_attribution
from app.models import AttentionTier, DeltaFactorType

def test_alpha_divergence_triggers_critical():
    # Stock down 3.5% while benchmark is +1.0% (expected was +1.7% with beta=1.7)
    # Alpha divergence is ~ -5.2%
    score, tier, factors = calculate_delta_attribution(
        ticker="NVDA",
        current_price=120.0,
        checkpoint_price=124.35,  # -3.5%
        beta=1.7,
        benchmark_pct=1.0,
        rvol=1.0,
        atr14=4.0,
        ema20=122.0,
        ema50=118.0,
        day_high=125.0,
        day_low=119.5
    )
    
    alpha_factors = [f for f in factors if f.factor_type == DeltaFactorType.BETA_DIVERGENCE]
    assert len(alpha_factors) > 0
    assert alpha_factors[0].severity == "CRITICAL"
    assert score >= 30.0

def test_rvol_anomaly_triggers_warning_and_critical():
    # RVol = 3.2x normal
    score, tier, factors = calculate_delta_attribution(
        ticker="PLTR",
        current_price=30.0,
        checkpoint_price=30.0,
        beta=1.0,
        benchmark_pct=0.0,
        rvol=3.2,
        atr14=1.5,
        ema20=29.0,
        ema50=28.0,
        day_high=30.5,
        day_low=29.5
    )
    rvol_factors = [f for f in factors if f.factor_type == DeltaFactorType.VOLUME_ANOMALY]
    assert len(rvol_factors) == 1
    assert rvol_factors[0].severity == "CRITICAL"
    assert rvol_factors[0].score_contribution >= 20.0

def test_atr_volatility_expansion():
    # Price swing $6.00 on ATR of $3.00 (2.0x ATR)
    score, tier, factors = calculate_delta_attribution(
        ticker="TSLA",
        current_price=200.0,
        checkpoint_price=206.0,
        beta=1.0,
        benchmark_pct=0.0,
        rvol=1.0,
        atr14=3.0,
        ema20=195.0,
        ema50=190.0,
        day_high=207.0,
        day_low=199.0
    )
    atr_factors = [f for f in factors if f.factor_type == DeltaFactorType.ATR_EXPANSION]
    assert len(atr_factors) == 1
    assert atr_factors[0].severity == "CRITICAL"

def test_quiet_tier_for_benign_drift():
    # Minor drift in line with market, normal volume, no broken levels
    score, tier, factors = calculate_delta_attribution(
        ticker="AAPL",
        current_price=220.20,
        checkpoint_price=220.00,  # +0.09%
        beta=1.0,
        benchmark_pct=0.10,
        rvol=0.95,
        atr14=3.0,
        ema20=215.0,
        ema50=210.0,
        day_high=221.0,
        day_low=219.0
    )
    assert tier == AttentionTier.QUIET
    assert score < 25.0
    assert len(factors) == 0
