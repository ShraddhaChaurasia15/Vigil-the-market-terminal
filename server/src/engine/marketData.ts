export interface TickerProfile {
  ticker: string;
  name: string;
  exchange: "NSE" | "BSE";
  sector: string;
  basePrice: number; // in INR (₹)
  beta: number;
  avgDailyVolume: number; // in shares
  ema20: number;
  ema50: number;
}

export interface SparklinePoint {
  time: string;
  price: number;
  isPostCheckpoint: boolean;
}

export const INDIAN_TICKER_CATALOG: Record<string, TickerProfile> = {
  RELIANCE: {
    ticker: "RELIANCE",
    name: "Reliance Industries Limited",
    exchange: "NSE",
    sector: "Oil, Gas & Consumer Retail",
    basePrice: 2980.50,
    beta: 1.15,
    avgDailyVolume: 8500000, // 85 Lakhs
    ema20: 2945.00,
    ema50: 2910.00
  },
  TCS: {
    ticker: "TCS",
    name: "Tata Consultancy Services Ltd",
    exchange: "NSE",
    sector: "Information Technology",
    basePrice: 4210.00,
    beta: 0.85,
    avgDailyVolume: 2200000, // 22 Lakhs
    ema20: 4180.00,
    ema50: 4120.00
  },
  INFY: {
    ticker: "INFY",
    name: "Infosys Limited",
    exchange: "NSE",
    sector: "Information Technology",
    basePrice: 1890.20,
    beta: 1.25,
    avgDailyVolume: 6500000, // 65 Lakhs
    ema20: 1870.00,
    ema50: 1835.00
  },
  HDFCBANK: {
    ticker: "HDFCBANK",
    name: "HDFC Bank Limited",
    exchange: "NSE",
    sector: "Banking & Financial Services",
    basePrice: 1640.00,
    beta: 1.05,
    avgDailyVolume: 18000000, // 1.8 Crores
    ema20: 1630.00,
    ema50: 1605.00
  },
  TATAMOTORS: {
    ticker: "TATAMOTORS",
    name: "Tata Motors Limited",
    exchange: "NSE",
    sector: "Automotive & EV",
    basePrice: 1080.00,
    beta: 1.65,
    avgDailyVolume: 14000000, // 1.4 Crores
    ema20: 1065.00,
    ema50: 1030.00
  },
  ZOMATO: {
    ticker: "ZOMATO",
    name: "Zomato Limited",
    exchange: "NSE",
    sector: "Internet & Q-Commerce",
    basePrice: 262.50,
    beta: 2.10,
    avgDailyVolume: 45000000, // 4.5 Crores
    ema20: 254.00,
    ema50: 238.00
  },
  ICICIBANK: {
    ticker: "ICICIBANK",
    name: "ICICI Bank Limited",
    exchange: "NSE",
    sector: "Banking & Financial Services",
    basePrice: 1215.00,
    beta: 1.10,
    avgDailyVolume: 12000000, // 1.2 Crores
    ema20: 1200.00,
    ema50: 1180.00
  },
  ITC: {
    ticker: "ITC",
    name: "ITC Limited",
    exchange: "NSE",
    sector: "FMCG & Diversified",
    basePrice: 495.00,
    beta: 0.65,
    avgDailyVolume: 11000000, // 1.1 Crores
    ema20: 492.00,
    ema50: 486.00
  },
  BHARTIARTL: {
    ticker: "BHARTIARTL",
    name: "Bharti Airtel Limited",
    exchange: "NSE",
    sector: "Telecommunications",
    basePrice: 1560.00,
    beta: 0.95,
    avgDailyVolume: 6000000, // 60 Lakhs
    ema20: 1540.00,
    ema50: 1510.00
  }
};

export class IndianMarketDataProvider {
  private shocks: Map<string, { shockPct: number; headline: string }> = new Map();

  public getTickerProfile(symbol: string): TickerProfile {
    const clean = symbol.toUpperCase().replace(/\.(NS|BO)$/, "").trim();
    if (INDIAN_TICKER_CATALOG[clean]) {
      return INDIAN_TICKER_CATALOG[clean];
    }
    return {
      ticker: clean,
      name: `${clean} India Limited`,
      exchange: "NSE",
      sector: "Indian Equities",
      basePrice: 500.00,
      beta: 1.10,
      avgDailyVolume: 5000000,
      ema20: 490.00,
      ema50: 475.00
    };
  }

  public getMarketRegime() {
    // Check IST time (UTC + 5:30)
    const now = new Date();
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const istTime = new Date(utcTime + (5.5 * 3600000));
    
    const day = istTime.getDay();
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const decimalTime = hours + minutes / 60;

    let status = "CLOSED";
    if (day >= 1 && day <= 5) {
      if (decimalTime >= 9.0 && decimalTime < 9.25) {
        status = "PRE_OPEN";
      } else if (decimalTime >= 9.25 && decimalTime <= 15.5) {
        status = "REGULAR_OPEN";
      } else {
        status = "CLOSED";
      }
    }

    return {
      exchange: "NSE / BSE (India)",
      sessionStatus: status,
      timezone: "IST (UTC+5:30)",
      benchmarks: [
        { symbol: "NIFTY 50", name: "NIFTY 50 Index", price: 25235.90, changePct: 0.48, changeAmt: 120.40 },
        { symbol: "SENSEX", name: "BSE SENSEX", price: 82365.70, changePct: 0.42, changeAmt: 345.10 },
        { symbol: "INDIA VIX", name: "Volatility Index", price: 13.85, changePct: -3.20, changeAmt: -0.45 }
      ],
      timestamp: istTime.toISOString()
    };
  }

  public generateIntradayData(
    symbol: string,
    checkpointMinutesAgo: number = 120
  ): {
    currentPrice: number;
    checkpointPrice: number;
    volume: number;
    rvol: number;
    sparkline: SparklinePoint[];
    catalystHeadline?: string;
  } {
    const profile = this.getTickerProfile(symbol);
    const base = profile.basePrice;
    const beta = profile.beta;

    // 25 time steps throughout the session (09:15 to 15:30, 15m intervals)
    const totalSteps = 25;
    const checkpointStep = Math.max(1, totalSteps - Math.floor(checkpointMinutesAgo / 15));

    // Deterministic pseudo-random walk
    let seed = 0;
    for (let i = 0; i < symbol.length; i++) {
      seed += symbol.charCodeAt(i);
    }
    const pseudoRandom = (step: number) => {
      const x = Math.sin(seed + step * 999) * 10000;
      return x - Math.floor(x);
    };

    const prices: number[] = [base];
    let cur = base;

    for (let s = 1; s <= totalSteps; s++) {
      const rand = pseudoRandom(s);
      // Nifty drift (+0.48% baseline) adjusted by stock Beta
      let stepReturn = (0.0003 * beta) + ((rand - 0.48) * 0.0055);

      // Inbuilt authentic behaviors for top stocks
      if (profile.ticker === "TATAMOTORS" && s >= 16) {
        stepReturn += 0.0055; // strong afternoon EV delivery ramp
      } else if (profile.ticker === "INFY" && s >= 18) {
        stepReturn -= 0.0070; // sudden drop after checkpoint
      } else if (profile.ticker === "ZOMATO" && s >= 15) {
        stepReturn += 0.0060; // quick commerce margin surge
      }

      cur = Math.max(1.0, cur * (1 + stepReturn));
      prices.push(Math.round(cur * 100) / 100);
    }

    // Check if manual evaluator shock exists
    let catalystHeadline: string | undefined;
    const shock = this.shocks.get(profile.ticker);
    if (shock) {
      catalystHeadline = shock.headline;
      for (let j = checkpointStep; j < prices.length; j++) {
        prices[j] = Math.round(prices[j] * (1 + shock.shockPct / 100) * 100) / 100;
      }
    }

    const currentPrice = prices[prices.length - 1];
    const checkpointPrice = prices[Math.min(checkpointStep, prices.length - 1)];

    // RVol & Natural Catalyst tagging
    let rvol = 1.1;
    if (profile.ticker === "TATAMOTORS") {
      rvol = 2.45;
      catalystHeadline = catalystHeadline || "EV segment quarterly volumes up 28% YoY; outperforming NIFTY Auto.";
    } else if (profile.ticker === "INFY") {
      rvol = 2.20;
      catalystHeadline = catalystHeadline || "Tier-1 BFSI contract renewal delayed; decoupling from NIFTY IT.";
    } else if (profile.ticker === "ZOMATO") {
      rvol = 1.95;
      catalystHeadline = catalystHeadline || "Blinkit daily order run-rate crosses new record high.";
    } else if (profile.ticker === "RELIANCE") {
      rvol = 1.15;
    } else if (profile.ticker === "HDFCBANK") {
      rvol = 1.05;
    } else {
      rvol = 1.0;
    }

    const volume = Math.floor(profile.avgDailyVolume * (totalSteps / 26.0) * rvol);

    // Build sparkline points starting from 09:15 IST
    const sparkline: SparklinePoint[] = [];
    const baseHour = 9;
    const baseMin = 15;

    for (let idx = 0; idx < prices.length; idx++) {
      const totalMinutes = baseMin + idx * 15;
      const h = baseHour + Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      const timeLabel = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      sparkline.push({
        time: timeLabel,
        price: prices[idx],
        isPostCheckpoint: idx >= checkpointStep
      });
    }

    return {
      currentPrice,
      checkpointPrice,
      volume,
      rvol,
      sparkline,
      catalystHeadline
    };
  }

  public injectShock(symbol: string, shockPct: number, headline: string) {
    this.shocks.set(symbol.toUpperCase(), { shockPct, headline });
  }

  public clearShocks() {
    this.shocks.clear();
  }
}

export const marketProvider = new IndianMarketDataProvider();
