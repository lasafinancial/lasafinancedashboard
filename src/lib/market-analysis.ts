export interface MarketMoodData {
  bullish: number;
  bearish: number;
  neutral: number;
  date: string;
}

export interface MarketStrengthData {
  date: string;
  rsi: number;
  ml_higher: number;
  ml_lower: number;
  fg_above?: number;
  fg_below?: number;
  fg_net?: number;
}


export interface TopMover {
  id: string;
  closePrice: number;
  changePercent: number;
}

export interface TopMoversData {
  topGainers?: TopMover[];
  topLosers?: TopMover[];
}

export const getMarketMoodDescription = (data: MarketMoodData, topMovers?: TopMoversData) => {
  const { bullish, bearish } = data;
  const diff = Math.abs(bullish - bearish);

  // If no top movers data, fall back to basic analysis
  if (!topMovers || !topMovers.topGainers || !topMovers.topLosers) {
    if (diff < 5) {
      return "The market is in a **balanced state**. Buyers and sellers are currently in a 'tug-of-war,' with almost equal numbers of stocks sitting at their ceilings (Resistance) and floors (Support). Expect a period of consolidation.";
    }

    if (bullish > bearish) {
      return `The market is showing **positive accumulation**. More stocks are testing their **Resistance (ceilings)** than their floors, suggesting that buyers are currently more aggressive and pushing for a potential breakout.`;
    }

    return `The market is under **selling pressure**. A majority of stocks are hovering near their **Support (safety floors)**, indicating that sellers are in control and investors are playing defense to avoid further drops.`;
  }


  // Enhanced analysis with top movers
  const gainers = topMovers.topGainers || [];
  const losers = topMovers.topLosers || [];

  const avgGain = gainers.length > 0 ? gainers.reduce((sum, s) => sum + (s.changePercent * 100), 0) / gainers.length : 0;
  const avgLoss = losers.length > 0 ? Math.abs(losers.reduce((sum, s) => sum + (s.changePercent * 100), 0) / losers.length) : 0;

  const strongGainers = gainers.filter(s => (s.changePercent * 100) > 3).length;
  const strongLosers = losers.filter(s => (s.changePercent * 100) < -3).length;

  // Balanced market
  if (diff < 5) {
    if (avgGain > 2 && avgLoss > 2) {
      return `The market is in a **balanced tug-of-war**. Top gainers are averaging **+${avgGain.toFixed(1)}%** while losers are down **-${avgLoss.toFixed(1)}%**, showing strong two-way action. **${strongGainers}** stocks are up 3%+ vs **${strongLosers}** down 3%+. This volatility within consolidation suggests a breakout is building—watch for directional confirmation.`;
    }
    return `The market is **range-bound** with muted momentum. Top gainers averaging **+${avgGain.toFixed(1)}%** and losers at **-${avgLoss.toFixed(1)}%** indicate limited conviction from either side. Expect choppy, sideways action until a catalyst emerges.`;
  }

  // Bullish market
  if (bullish > bearish) {
    if (strongGainers >= 7) {
      return `The market shows **strong bullish momentum**. **${strongGainers} out of 10** top gainers are up 3%+, averaging **+${avgGain.toFixed(1)}%**, while losers are only down **-${avgLoss.toFixed(1)}%** on average. This **asymmetric strength** (strong gains, shallow losses) signals aggressive buying and favorable risk-reward for long positions.`;
    }
    if (avgGain > avgLoss * 1.5) {
      return `The market is in **positive accumulation** with **gains outpacing losses**. Top gainers averaging **+${avgGain.toFixed(1)}%** vs losers at **-${avgLoss.toFixed(1)}%** shows buyers are more aggressive. More stocks are testing **Resistance levels**, suggesting potential for upside continuation.`;
    }
    return `The market has a **mild bullish bias**, but momentum is not yet decisive. Gainers averaging **+${avgGain.toFixed(1)}%** vs **-${avgLoss.toFixed(1)}%** for losers. Watch for stronger follow-through before committing heavily to long positions.`;
  }

  // Bearish market
  if (strongLosers >= 7) {
    return `The market is under **heavy selling pressure**. **${strongLosers} out of 10** losers are down 3%+, averaging **-${avgLoss.toFixed(1)}%**, while gainers are only up **+${avgGain.toFixed(1)}%**. This **asymmetric weakness** signals defensive positioning—most stocks are testing **Support floors**. Caution advised for new longs.`;
  }
  if (avgLoss > avgGain * 1.5) {
    return `The market is experiencing **distribution** with **losses outweighing gains**. Losers averaging **-${avgLoss.toFixed(1)}%** vs gainers at **+${avgGain.toFixed(1)}%** shows sellers are in control. Majority of stocks hovering near **Support levels**—risk management is critical.`;
  }
  return `The market has a **mild bearish bias**. Losers averaging **-${avgLoss.toFixed(1)}%** vs **+${avgGain.toFixed(1)}%** for gainers, but the move lacks conviction. Monitor for stabilization signals before considering long entries.`;
};

export const getMarketStrengthDescription = (data: MarketStrengthData[]) => {
  if (!data || data.length === 0) return "";
  const latest = data[data.length - 1];
  const rsi = latest.rsi;

  if (rsi <= 40) {
    return `At **${rsi}**, the Momentum Oscillator shows a **pullback zone**. In bullish trends, pullbacks toward 40 or below often indicate healthy retracements, offering **favorable zones for long positions**.`;
  }

  if (rsi >= 70) {
    return `At **${rsi}**, the Momentum Oscillator is in **elevated territory**. In strong bullish phases, momentum can extend up to 80, signalling **trend strength rather than immediate reversal**.`;
  }

  if (rsi >= 60) {
    return `At **${rsi}**, the Momentum Oscillator shows **elevated momentum**. In bearish trends, upside swings tend to lose momentum around 60, making **longs riskier** at these levels.`;
  }

  return `At **${rsi}**, the Momentum Oscillator is in **neutral territory**. Watch for directional signals - pullbacks below 40 in bullish trends offer better long entries, while resistance near 60 may limit upside in bearish trends.`;
};

export const getMLStrengthDescription = (data: MarketStrengthData[]) => {
  if (!data || data.length === 0) return "";
  const latest = data[data.length - 1];
  const { rsi } = latest;

  if (rsi > 60) {
    return `At **${rsi}**, the ML Meter is **Above 60**. Majority of stocks have cooled off after pullbacks and are better positioned for an upside swing. **Long setups generally offer better risk-reward.**`;
  }

  if (rsi >= 50 && rsi <= 60) {
    return `At **${rsi}**, the ML Meter is in the **50-60 zone**. Mixed conditions prevail. **Selective trading is advised with strict risk control.** Wait for clearer signals before committing.`;
  }

  return `At **${rsi}**, the ML Meter is **Below 50**. Most stocks are extended. **Upside may be limited** and traders should be cautious with long positions. Consider defensive positioning.`;
};

export const getOverallSentimentDescription = (score: number, verdict: string) => {
  const isBullish = verdict.toUpperCase() === "BULLISH";

  if (isBullish) {
    return `The overall classification is **Positive Bias**. With a sentiment score of **${Math.round(score)}/100**, historical patterns show upward characteristics dominating. This classification is derived from pattern similarity analysis.`;
  }

  if (verdict.toUpperCase() === "BEARISH") {
    return `The overall classification is **Negative Bias**. With a sentiment score of **${Math.round(score)}/100**, historical pattern analysis indicates a period where defensive characteristics dominate. This classification is based on trend persistence patterns.`;
  }

  return `The overall classification is **Neutral Bias**. A sentiment score of **${Math.round(score)}/100** reflects a balanced state. This classification indicates no strong directional bias based on pattern similarity.`;
};

export const getMarketBalanceDescription = (data: MarketStrengthData[]) => {
  if (!data || data.length === 0) return "";
  const latest = data[data.length - 1];
  // Swap these because the data fields are inverted relative to UI labels
  const fgAbove = latest.fg_below || 0;
  const fgBelow = latest.fg_above || 0;
  const fgNet = fgAbove - fgBelow;

  if (fgAbove > 20) {
    return `Balance Above at **${fgAbove}** signals **strong acceptance** at higher prices. Probability of **upside continuation is higher** than downside - long positions favourable.`;
  }

  if (fgBelow > fgAbove) {
    return `Balance Below (**${fgBelow}**) exceeds Above (**${fgAbove}**). This indicates **weakening acceptance** at higher levels. Traders should **stay cautious** - market may correct or pullback.`;
  }

  return `Balance Above at **${fgAbove}** vs Below at **${fgBelow}**. Market is tracking price acceptance levels. Use alongside trend and risk indicators for complete analysis.`;
};
