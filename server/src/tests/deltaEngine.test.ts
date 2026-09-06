import test from "node:test";
import assert from "node:assert/strict";
import { evaluateIndianStockDelta, formatIndianVolume } from "../engine/deltaEngine.js";

test("formatIndianVolume formats Lakhs and Crores accurately", () => {
  assert.equal(formatIndianVolume(15000000), "1.50 Cr");
  assert.equal(formatIndianVolume(6500000), "65.00 L");
  assert.equal(formatIndianVolume(45000), "45.0 K");
});

test("evaluateIndianStockDelta flags Nifty divergence as critical", () => {
  // INFY fell -2.5% while NIFTY 50 was +0.50%
  const result = evaluateIndianStockDelta({
    ticker: "INFY",
    currentPrice: 1850.00,
    checkpointPrice: 1897.40, // ~ -2.5%
    beta: 1.25,
    niftyChangePct: 0.50,
    rvol: 1.1,
    ema20: 1870.00,
    ema50: 1840.00
  });

  assert.equal(result.isMeaningfulChange, true);
  const divFactor = result.factors.find(f => f.type === "NIFTY_DIVERGENCE");
  assert.ok(divFactor, "Should detect Nifty Decoupling");
  assert.equal(result.attentionTier, "URGENT");
});

test("evaluateIndianStockDelta detects heavy volume surge", () => {
  const result = evaluateIndianStockDelta({
    ticker: "TATAMOTORS",
    currentPrice: 1080.00,
    checkpointPrice: 1078.00,
    beta: 1.65,
    niftyChangePct: 0.20,
    rvol: 2.45,
    ema20: 1065.00,
    ema50: 1030.00
  });

  assert.equal(result.isMeaningfulChange, true);
  const volFactor = result.factors.find(f => f.type === "VOLUME_SURGE");
  assert.ok(volFactor, "Should detect Volume Surge");
  assert.equal(volFactor?.severity, "CRITICAL");
});

test("evaluateIndianStockDelta flags Stop Loss violation as CRITICAL", () => {
  const result = evaluateIndianStockDelta({
    ticker: "RELIANCE",
    currentPrice: 2840.00,
    checkpointPrice: 2890.00,
    beta: 1.15,
    niftyChangePct: -0.10,
    rvol: 1.0,
    ema20: 2940.00,
    ema50: 2910.00,
    stopPrice: 2850.00
  });

  assert.equal(result.attentionTier, "URGENT");
  const stopFactor = result.factors.find(f => f.type === "TARGET_STOP");
  assert.ok(stopFactor);
  assert.equal(stopFactor?.severity, "CRITICAL");
});

test("evaluateIndianStockDelta keeps low-noise stock in STEADY tier", () => {
  const result = evaluateIndianStockDelta({
    ticker: "ITC",
    currentPrice: 495.50,
    checkpointPrice: 495.00, // +0.10%
    beta: 0.65,
    niftyChangePct: 0.15,
    rvol: 0.95,
    ema20: 492.00,
    ema50: 486.00
  });

  assert.equal(result.attentionTier, "STEADY");
  assert.equal(result.isMeaningfulChange, false);
  assert.equal(result.factors.length, 0);
});
