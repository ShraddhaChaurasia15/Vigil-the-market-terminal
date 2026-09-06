from typing import List, Dict, Any, Optional
import math
from app.models import AttentionTier, DeltaFactor, DeltaFactorType

def calculate_delta_attribution(
    ticker: str,
    current_price: float,
    checkpoint_price: float,
    beta: float,
    benchmark_pct: float,
    rvol: float,
    atr14: float,
    ema20: float,
    ema50: float,
    day_high: float,
    day_low: float,
    target_price: Optional[float] = None,
    stop_price: Optional[float] = None,
    catalyst_headline: Optional[str] = None
) -> tuple[float, AttentionTier, List[DeltaFactor]]:
    """
    Computes deterministic Delta Score (0-100), Attention Tier, and granular Delta Factors.
    """
    factors: List[DeltaFactor] = []
    score: float = 0.0

    if checkpoint_price <= 0:
        checkpoint_price = current_price

    # 1. Delta since checkpoint percentage
    delta_pct = ((current_price - checkpoint_price) / checkpoint_price) * 100.0

    # 2. Beta-adjusted Alpha Divergence
    # Expected move = beta * benchmark_pct
    expected_pct = beta * benchmark_pct
    alpha_divergence = delta_pct - expected_pct
    abs_alpha = abs(alpha_divergence)

    if abs_alpha >= 1.5:
        alpha_contrib = min(35.0, 15.0 + (abs_alpha - 1.5) * 8.0)
        direction = "drag" if alpha_divergence < 0 else "decoupling surge"
        severity = "CRITICAL" if abs_alpha >= 3.0 else "WARNING"
        factors.append(DeltaFactor(
            factor_type=DeltaFactorType.BETA_DIVERGENCE,
            label=f"Beta Divergence ({alpha_divergence:+.1f}%)",
            description=f"Idiosyncratic {direction}: moved {delta_pct:+.1f}% vs expected {expected_pct:+.1f}% based on market tide.",
            severity=severity,
            score_contribution=round(alpha_contrib, 1)
        ))
        score += alpha_contrib

    # 3. Relative Volume (RVol) Anomaly
    if rvol >= 1.8:
        rvol_contrib = min(25.0, (rvol - 1.0) * 10.0)
        severity = "CRITICAL" if rvol >= 3.0 else "WARNING"
        factors.append(DeltaFactor(
            factor_type=DeltaFactorType.VOLUME_ANOMALY,
            label=f"RVol Anomaly ({rvol:.1f}x)",
            description=f"Unusual institutional volume pacing: running at {rvol:.1f}x normal historical volume for this time of day.",
            severity=severity,
            score_contribution=round(rvol_contrib, 1)
        ))
        score += rvol_contrib

    # 4. ATR Volatility Expansion
    price_range = abs(current_price - checkpoint_price)
    if atr14 > 0:
        excursion_ratio = price_range / atr14
        if excursion_ratio >= 0.75:
            atr_contrib = min(25.0, excursion_ratio * 18.0)
            severity = "CRITICAL" if excursion_ratio >= 1.5 else "WARNING"
            factors.append(DeltaFactor(
                factor_type=DeltaFactorType.ATR_EXPANSION,
                label=f"ATR Range Shock ({excursion_ratio:.1f}x ATR)",
                description=f"Swing of ${price_range:.2f} has absorbed {excursion_ratio:.1f}x of the asset's typical 14-day true range.",
                severity=severity,
                score_contribution=round(atr_contrib, 1)
            ))
            score += atr_contrib

    # 5. Technical Level Violations (EMAs, Day Extremes, Targets)
    # Check if checkpoint was on one side of EMA and current is on the other
    if ema20 > 0:
        if (checkpoint_price >= ema20 and current_price < ema20) or (checkpoint_price <= ema20 and current_price > ema20):
            cross_dir = "Lost" if current_price < ema20 else "Reclaimed"
            level_contrib = 15.0
            factors.append(DeltaFactor(
                factor_type=DeltaFactorType.LEVEL_CROSS,
                label=f"{cross_dir} 20 EMA (${ema20:.2f})",
                description=f"Price sliced through the short-term trend anchor (20 EMA).",
                severity="WARNING",
                score_contribution=level_contrib
            ))
            score += level_contrib

    if ema50 > 0:
        if (checkpoint_price >= ema50 and current_price < ema50) or (checkpoint_price <= ema50 and current_price > ema50):
            cross_dir = "Lost" if current_price < ema50 else "Reclaimed"
            level_contrib = 20.0
            factors.append(DeltaFactor(
                factor_type=DeltaFactorType.LEVEL_CROSS,
                label=f"{cross_dir} 50 EMA (${ema50:.2f})",
                description=f"Major structural break: penetrated the medium-term 50 EMA.",
                severity="CRITICAL",
                score_contribution=level_contrib
            ))
            score += level_contrib

    # Alert Triggers (User-set Target / Stop)
    if stop_price and stop_price > 0 and current_price <= stop_price and checkpoint_price > stop_price:
        factors.append(DeltaFactor(
            factor_type=DeltaFactorType.ALERT_TRIGGER,
            label="Stop Level Breached",
            description=f"Price dropped below defined risk boundary of ${stop_price:.2f}.",
            severity="CRITICAL",
            score_contribution=30.0
        ))
        score += 30.0

    if target_price and target_price > 0 and current_price >= target_price and checkpoint_price < target_price:
        factors.append(DeltaFactor(
            factor_type=DeltaFactorType.ALERT_TRIGGER,
            label="Target Level Achieved",
            description=f"Price crossed above target objective of ${target_price:.2f}.",
            severity="INFO",
            score_contribution=20.0
        ))
        score += 20.0

    # 6. Catalyst News
    if catalyst_headline:
        factors.append(DeltaFactor(
            factor_type=DeltaFactorType.CATALYST_NEWS,
            label="Breaking Catalyst",
            description=catalyst_headline,
            severity="CRITICAL",
            score_contribution=25.0
        ))
        score += 25.0

    # Bounded score
    final_score = round(min(100.0, max(0.0, score)), 1)

    # Attention Tier classification
    if final_score >= 50.0:
        tier = AttentionTier.URGENT
    elif final_score >= 25.0:
        tier = AttentionTier.DEVELOPING
    else:
        tier = AttentionTier.QUIET

    return final_score, tier, factors
