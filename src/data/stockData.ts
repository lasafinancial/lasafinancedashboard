import stocksData from "./processed/stock_data.json";

// Derive sectorData from the processed JSON
const derivedSectorData: Record<string, any[]> = {};

stocksData.forEach((stock: any) => {
  const sector = stock.sector || "Other";
  if (!derivedSectorData[sector]) {
    derivedSectorData[sector] = [];
  }
  
  const latestHistory = stock.history && stock.history.length > 0 
    ? stock.history[stock.history.length - 1] 
    : { support: 0, resistance: 0 };

  derivedSectorData[sector].push({
    name: stock.name,
    symbol: stock.symbol,
    support: latestHistory.support || 0,
    resistance: latestHistory.resistance || 0
  });
});

export { derivedSectorData as sectorData };

// Filter only INDEX data for dashboard
const indexData = stocksData.filter((stock: any) => stock.sector === "INDEX");
const derivedIndexSectorData: Record<string, any[]> = { INDEX: [] };

indexData.forEach((stock: any) => {
  const latestHistory = stock.history && stock.history.length > 0 
    ? stock.history[stock.history.length - 1] 
    : { support: 0, resistance: 0 };

  derivedIndexSectorData.INDEX.push({
    name: stock.name,
    symbol: stock.symbol,
    support: latestHistory.support || 0,
    resistance: latestHistory.resistance || 0
  });
});

// Ensure INDEX always exists even if empty
if (!derivedIndexSectorData.INDEX) {
  derivedIndexSectorData.INDEX = [];
}

export { derivedIndexSectorData as indexSectorData };

// Export stocks list
export const stocks = stocksData.map((stock: any) => ({
  symbol: stock.symbol,
  name: stock.name,
  sector: stock.sector
}));

// Placeholder for other hardcoded exports if needed, but derived from data
export const marketIndicators = {
  // These are now handled by market_mood.json and market_strength.json in components
  rsi: { value: 0, verdict: "See Market Strength", label: "RSI Meter" },
  ml: { value: 0, confidence: 0, verdict: "See ML Meter", label: "ML Meter" },
};

export const regimeOptions = ["Range Bound", "Trending", "Structure Break"];

export const getStockChartData = (symbol: string) => {
  const stock = stocksData.find((s: any) => s.symbol === symbol);
  return stock?.history || [];
};
