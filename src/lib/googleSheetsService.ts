export interface StockHistoryItem {
  price: number;
  rsi: number;
  trend: string;
  support: number;
  resistance: number;
  mlFutPrice20d: number;
  wolfeD: number;
  projFvg: number;
  date: string;
}

export interface StockData {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  rsi: number;
  trend: string;
  history: StockHistoryItem[];
}

export interface MarketMood {
  bullish: number;
  bearish: number;
  neutral: number;
  date: string;
}

export interface MarketStrengthItem {
  date: string;
  rsi: number;
  ml_higher: number;
  ml_lower: number;
  fg_above: number;
  fg_below: number;
  fg_net: number;
}

export interface MarketPositionData {
  model: { bullish: number; bearish: number; neutral: number };
  balance: { above: number; below: number };
  momentum: { bullish: number; bearish: number };
  sr: { atSupport: number; atResistance: number; neutral: number };
  reversal: { up: number; down: number; neutral: number };
  lastUpdate: string;
}

export interface TopMoversData {
  topGainers: Array<{ id: string; stockName: string; changePercent: number; closePrice: number; marketCap: number }>;
  topLosers: Array<{ id: string; stockName: string; changePercent: number; closePrice: number; marketCap: number }>;
}

export interface GoogleSheetsData {
  marketMood: MarketMood;
  marketStrength: MarketStrengthItem[];
  marketPosition: MarketPositionData;
  stockData: StockData[];
  topMovers: TopMoversData;
  indexPerformance: any[];
  lastUpdated: string;
}

let cachedData: GoogleSheetsData | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 60 * 1000;
let refreshInterval: ReturnType<typeof setInterval> | null = null;

const dataListeners: Set<(data: GoogleSheetsData) => void> = new Set();

export function subscribeToData(callback: (data: GoogleSheetsData) => void): () => void {
  dataListeners.add(callback);
  if (cachedData) {
    callback(cachedData);
  }
  return () => {
    dataListeners.delete(callback);
  };
}

function notifyListeners(data: GoogleSheetsData) {
  dataListeners.forEach(callback => callback(data));
}

export async function refreshAllData(): Promise<GoogleSheetsData | null> {
  const now = Date.now();
  
  if (cachedData && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedData;
  }

  try {
    const response = await fetch('/api/fetch-data');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: GoogleSheetsData = await response.json();
    
    cachedData = data;
    lastFetchTime = now;
    
    notifyListeners(data);
    
    console.log('Live data refreshed at:', new Date().toLocaleTimeString());
    return data;
  } catch (error) {
    console.error('Error refreshing data:', error);
    return cachedData;
  }
}

export function startAutoRefresh(intervalMs: number = 5 * 60 * 1000): void {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  
  refreshAllData();
  
  refreshInterval = setInterval(() => {
    refreshAllData();
  }, intervalMs);
  
  console.log(`Auto-refresh started with ${intervalMs / 1000}s interval`);
}

export function stopAutoRefresh(): void {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
    console.log('Auto-refresh stopped');
  }
}

export function getCachedData(): GoogleSheetsData | null {
  return cachedData;
}

export async function getStockData(): Promise<StockData[]> {
  const data = await refreshAllData();
  return data?.stockData || [];
}

export async function getMarketMood(): Promise<MarketMood | null> {
  const data = await refreshAllData();
  return data?.marketMood || null;
}

export async function getMarketStrength(): Promise<MarketStrengthItem[]> {
  const data = await refreshAllData();
  return data?.marketStrength || [];
}

export async function getMarketPosition(): Promise<MarketPositionData | null> {
  const data = await refreshAllData();
  return data?.marketPosition || null;
}

export async function getTopMovers(): Promise<TopMoversData | null> {
  const data = await refreshAllData();
  return data?.topMovers || null;
}
