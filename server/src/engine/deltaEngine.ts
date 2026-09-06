export type AttentionTier = "URGENT" | "DEVELOPING" | "STEADY";

export interface DeltaFactor {
  type: "PRICE_SWING" | "NIFTY_DIVERGENCE" | "VOLUME_SURGE" | "LEVEL_BREACH" | "TARGET_STOP";
  label: string;
  description: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
}

export interface ComputedDelta {
  deltaAmt: number; // in ₹
  deltaPct: number; // in %
  isMeaningfulChange: boolean;
  attentionTier: AttentionTier;
  deltaScore: number; // 0 to 100
  factors: DeltaFactor[];
}

export function formatIndianVolume(volume: number): string {
  if (volume >= 10000000) {
    return `${(volume / 10000000).toFixed(2)} Cr`;
  } else if (volume >= 100000) {
    return `${(volume / 100000).toFixed(2)} L`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)} K`;
  }
  return volume.toLocaleString("en-IN");
}

export function evaluateIndianStockDelta(params: {
  ticker: string;
  currentPrice: number;
  checkpointPrice: number;
  beta: number;
  niftyChangePct: number;
  rvol: number;
  ema20: number;
  ema50: number;
  targetPrice?: number | null;
  stopPrice?: number | null;
  catalystHeadline?: string;
}): ComputedDelta {
  const {
    ticker,
    currentPrice,
    checkpointPrice,
    beta,
    niftyChangePct,
    rvol,
    ema20,
    ema50,
    targetPrice,
    stopPrice,
    catalystHeadline
  } = params;

  const validCheckpointPrice = checkpointPrice > 0 ? checkpointPrice : currentPrice;
  const deltaAmt = Math.round((currentPrice - validCheckpointPrice) * 100) / 100;
  const deltaPct = Math.round(((currentPrice - validCheckpointPrice) / validCheckpointPrice) * 10000) / 100;

  const factors: DeltaFactor[] = [];
  let score = 0;

  // RULE 1: Price Swing Threshold (>= 2.0% change since checkpoint)
  if (Math.abs(deltaPct) >= 2.0) {
    const dir = deltaPct > 0 ? "surge" : "decline";
    const severity = Math.abs(deltaPct) >= 3.0 ? "CRITICAL" : "WARNING";
    factors.push({
      type: "PRICE_SWING",
      label: `Significant Swing (${deltaPct > 0 ? "+" : ""}${deltaPct.toFixed(2)}%)`,
      description: `${ticker} has experienced a sharp intraday ${dir} of ₹${Math.abs(deltaAmt).toFixed(2)} since your last check.`,
      severity
    });
    score += Math.min(35, Math.abs(deltaPct) * 10);
  }

  // RULE 2: Nifty 50 Benchmark Divergence
  const expectedReturn = beta * niftyChangePct;
  const alphaDivergence = deltaPct - expectedReturn;

  if (Math.abs(alphaDivergence) >= 1.5) {
    const isDrag = alphaDivergence < 0;
    factors.push({
      type: "NIFTY_DIVERGENCE",
      label: `Nifty Decoupling (${alphaDivergence > 0 ? "+" : ""}${alphaDivergence.toFixed(2)}% α)`,
      description: isDrag
        ? `Lacking market momentum: fell ${deltaPct.toFixed(2)}% despite NIFTY 50 moving ${niftyChangePct >= 0 ? "+" : ""}${niftyChangePct.toFixed(2)}%.`
        : `Idiosyncratic rally: jumped ${deltaPct.toFixed(2)}% against expected ${expectedReturn.toFixed(2)}% based on Nifty beta.`,
      severity: Math.abs(alphaDivergence) >= 2.5 ? "CRITICAL" : "WARNING"
    });
    score += Math.min(30, Math.abs(alphaDivergence) * 10);
  }

  // RULE 3: Volume Surge (>= 1.5x pacing)
  if (rvol >= 1.5) {
    factors.push({
      type: "VOLUME_SURGE",
      label: `Heavy Volume (${rvol.toFixed(1)}x RVol)`,
      description: `Institutional participation detected: volume pacing is ${rvol.toFixed(1)}x typical historical volume.`,
      severity: rvol >= 2.2 ? "CRITICAL" : "WARNING"
    });
    score += Math.min(25, (rvol - 1) * 15);
  }

  // Additional Structural Checks: Stop / Target breaches
  if (stopPrice && currentPrice <= stopPrice && validCheckpointPrice > stopPrice) {
    factors.push({
      type: "TARGET_STOP",
      label: `Stop Loss Breached (₹${stopPrice})`,
      description: `Price penetrated below your defined downside protection level of ₹${stopPrice.toFixed(2)}.`,
      severity: "CRITICAL"
    });
    score += 40;
  }

  if (targetPrice && currentPrice >= targetPrice && validCheckpointPrice < targetPrice) {
    factors.push({
      type: "TARGET_STOP",
      label: `Target Price Hit (₹${targetPrice})`,
      description: `Price reached your upside target objective of ₹${targetPrice.toFixed(2)}.`,
      severity: "INFO"
    });
    score += 25;
  }

  // Level Crossings
  if (ema20 > 0) {
    if (validCheckpointPrice >= ema20 && currentPrice < ema20) {
      factors.push({
        type: "LEVEL_BREACH",
        label: `Broke Below 20 EMA (₹${ema20})`,
        description: `Price lost short-term moving average support.`,
        severity: "WARNING"
      });
      score += 15;
    } else if (validCheckpointPrice <= ema20 && currentPrice > ema20) {
      factors.push({
        type: "LEVEL_BREACH",
        label: `Reclaimed 20 EMA (₹${ema20})`,
        description: `Price broke out above short-term 20 EMA.`,
        severity: "INFO"
      });
      score += 15;
    }
  }

  const isMeaningfulChange = factors.length > 0;
  const deltaScore = Math.min(100, Math.round(score));

  let attentionTier: AttentionTier = "STEADY";
  if (deltaScore >= 45 || factors.some(f => f.severity === "CRITICAL")) {
    attentionTier = "URGENT";
  } else if (deltaScore >= 20 || factors.length >= 1) {
    attentionTier = "DEVELOPING";
  }

  return {
    deltaAmt,
    deltaPct,
    isMeaningfulChange,
    attentionTier,
    deltaScore,
    factors
  };
}
