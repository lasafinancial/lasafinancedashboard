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
  trend: Array<{
    date: string;
    bullish: number;
    bearish: number;
    neutral: number;
  }>;
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

export interface NearResistanceStock {
  dEma200Status: string;
  id: string;
  closePrice: number;
  resistance: number;
  support: number;
  dBreakoutPrice: number;
  mlTargetPercent: number;
  changePercent?: number;
  algoB: number;
  algFgPercent: number;
  wProjection2: number;
  wProjection3: number;
  algoFG: number;
  algoM: number;
  algoW: number;
  fr?: string;
  obvSignal?: string;
}

export interface IntradayReversalStock {
  date: string;
  reversalDetectedAt: string;
  symbol: string;
  breakoutTime: string;
  breakoutPrice: number;
  haClose: number;
  dropFromHigh: number;
  candlesSinceBreakout: number;
  reversalCandleTime: string;
  obvSignal?: string;
  fr?: string;
}

export interface DailyNewsItem {
  date: string;
  stock: string;
  company: string;
  news: string;
  impact: string;
  reason: string;
  sector: string;
  source: string;
}

export interface NiftyAnalysisData {
  summary: {
    date: string;
    marketMood: string;
    niftyClose: string;
  };
  scenarios: Array<{
    scenario: string;
    probability: string;
    direction: string;
    trigger: string;
    target: string;
    keyStocks: string;
  }>;
  actionPlan: Array<{
    traderType: string;
    action: string;
    detail: string;
    keyLevels: string;
    suggestedStocks: string;
  }>;
}

export interface StockSummaryItem {
  stock: string;
  cmp: string;
  dataDate: string;
  algoBalance: string;
  algoModel: string;
  algoPattern: string;
  bias: string;
  direction: string;
  generatedAt: string;
}

export interface GoogleSheetsData {
  marketMood: MarketMood;
  marketStrength: MarketStrengthItem[];
  marketPosition: MarketPositionData;
  stockData: StockData[];
  topMovers: TopMoversData;
  indexPerformance: any[];
  nearResistance?: any[];
  supportReversal?: any[];
  reactionZone: any[];
  intradayBreakout: any[];
  intradayBreakoutScanner?: any[];
  intradayReversal?: IntradayReversalStock[];
  intradayDev: any[];
  intradayDevChanges?: any[];
  goldenAlerts?: any[];
  playbackSnapshots?: any[];
  dailyNews: DailyNewsItem[];
  niftyAnalysis?: NiftyAnalysisData;
  niftyOptionsData?: any[];
  summaries?: StockSummaryItem[];
  lastUpdated: string;
}

let cachedData: GoogleSheetsData | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 45 * 1000; // 45 seconds
let refreshInterval: ReturnType<typeof setInterval> | null = null;

const dataListeners: Set<(data: GoogleSheetsData) => void> = new Set();

import { getApiUrl } from '@/config/api';
import { isMarketOpen } from './marketHours';

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

export async function refreshAllData(force: boolean = false): Promise<GoogleSheetsData | null> {
  const now = Date.now();

  // If not forced and market is closed, return cached data to avoid unnecessary API calls
  if (!force && !isMarketOpen() && cachedData) {
    console.log('Market is closed. Skipping auto-refresh and using cached data.');
    return cachedData;
  }

  if (!force && cachedData && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedData;
  }

  try {
    let finalUrl = getApiUrl('/api/fetch-data');
    if (force) {
      finalUrl += finalUrl.includes('?') ? '&force=true' : '?force=true';
    }
    
    const response = await fetch(finalUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: GoogleSheetsData = await response.json();

    // Fetch Nifty Options Data
    try {
      const optionsRes = await fetch(getApiUrl('/api/nifty-options-data'));
      if (optionsRes.ok) {
        data.niftyOptionsData = await optionsRes.json();
      }
    } catch (e) {
      console.warn('Could not fetch nifty options data:', e);
    }

    // --- FALLBACK-TO-CACHE RESILIENCE LAYER ---
    // If the backend Google Sheets are momentarily empty due to an update,
    // prevent the frontend from rendering an empty "No Data Found" state.
    if (cachedData) {
      const arraysToProtect: (keyof GoogleSheetsData)[] = [
        'intradayReversal',
        'intradayDev',
        'intradayBreakoutScanner',
        'goldenAlerts',
        'nearResistance',
        'supportReversal',
        'reactionZone',
        'stockData',
        'dailyNews',
        'summaries',
        'playbackSnapshots'
      ];

      arraysToProtect.forEach(key => {
        // If the new array is empty but we have old cached data, keep the old data!
        if (
          Array.isArray(data[key]) && 
          (data[key] as any[]).length === 0 && 
          Array.isArray(cachedData![key]) && 
          (cachedData![key] as any[]).length > 0
        ) {
          console.warn(`[Resilience] ${key} returned empty. Falling back to cached data.`);
          (data as any)[key] = cachedData![key];
        }
      });
    }

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

export function startAutoRefresh(intervalMs: number = 90 * 1000): void {
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

export async function getNearResistance(): Promise<NearResistanceStock[]> {
  const data = await refreshAllData();
  return data?.nearResistance || [];
}
