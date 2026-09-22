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

export interface ExitTargetScreenerItem {
  date: string;
  id: string;
  buyPrice: string;
  currentPrice?: string;
  targetPrice: string;
  targetsHit?: string;
  profit: string;
  status: string;
  reason: string;
  exitReason?: string;
  exitDate: string;
  stoploss: string;
  holdingDays?: string;
  exitPrice?: string;
  // Range-bar values, straight from the sheet
  rangeTarget?: string;       // column L
  potentialLeft?: string;     // column AB
  stoplossDistance?: string;  // column AC
  riskReward?: string;        // column AD
}

export interface WeeklyRecommendationItem {
  date: string;
  id: string;
  entryDate: string;
  buyPrice: string;
  currentPrice: string;
  profit: string;
  status: string;
  reason: string;
  fundamentalView: string;
  exitReason: string;
  exitDate: string;
  holdingWeeks?: string;
  exitPrice?: string;
  targetPrice?: string;
  potential?: string;         // column AU
}

export interface Week52HighStock {
  id: string;
  currentPrice: number;
  high52: number;
  resistance: number;
  support: number;
  sector?: string;
  group?: string;
  changePercent?: number;
}

export interface Week52LowStock {
  id: string;
  currentPrice: number;
  low52: number;
  resistance: number;
  support: number;
  sector?: string;
  group?: string;
  changePercent?: number;
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
  tickerTape?: string[];
  niftyAnalysis?: NiftyAnalysisData;
  niftyOptionsData?: any[];
  summaries?: StockSummaryItem[];
  exitTargetScreener?: ExitTargetScreenerItem[];
  weeklyRecommendation?: WeeklyRecommendationItem[];
  week52High?: Week52HighStock[];
  week52Low?: Week52LowStock[];
  lastUpdated: string;
}

// Persists the last successful fetch to localStorage so a fresh page load (or hard refresh)
// can render real data instantly instead of waiting on a network round-trip. The in-memory
// `cachedData` var alone doesn't survive a reload, which is what made every page load block
// on /api/fetch-data even when we'd already fetched the same data moments earlier.
const CACHE_STORAGE_KEY = 'lasa_live_data_cache_v1';

function loadCacheFromStorage(): GoogleSheetsData | null {
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GoogleSheetsData) : null;
  } catch {
    return null;
  }
}

function saveCacheToStorage(data: GoogleSheetsData): void {
  try {
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // Storage full or unavailable (private browsing, quota exceeded) - in-memory cache still works
    console.warn('[googleSheetsService] Could not persist cache to localStorage:', e);
  }
}

let cachedData: GoogleSheetsData | null = loadCacheFromStorage();
let lastFetchTime: number = 0;
let lastEODFetchDate: string | null = null;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes during market hours
let refreshInterval: ReturnType<typeof setInterval> | null = null;

const dataListeners: Set<(data: GoogleSheetsData) => void> = new Set();

import { getApiUrl } from '@/config/api';
import { isMarketOpen, isEODWindow, getISTDateKey } from './marketHours';

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
  const marketOpen = isMarketOpen();
  const eodWindow = isEODWindow();
  const todayKey = getISTDateKey();

  // Guard: Outside market hours, only allow refresh if in the 22:30 EOD window once per day
  if (!force && !marketOpen && cachedData) {
    if (eodWindow && lastEODFetchDate !== todayKey) {
      console.log('[googleSheetsService] 22:30 IST EOD window active. Fetching once-a-day EOD data.');
    } else {
      console.log('[googleSheetsService] Market is closed. Skipping auto-refresh and using cached data.');
      return cachedData;
    }
  }

  // During market hours, respect the 15-minute cache TTL
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

    // Mark EOD update as completed for today if fetched outside market hours
    if (!marketOpen && eodWindow) {
      lastEODFetchDate = todayKey;
    }

    // --- FALLBACK-TO-CACHE RESILIENCE LAYER ---
    // If the backend Google Sheets are momentarily empty due to an update,
    // prevent the frontend from rendering an empty "No Data Found" state.
    if (cachedData) {
      const arraysToProtect: (keyof GoogleSheetsData)[] = [
        'intradayReversal',
        'intradayDev',
        'intradayBreakout',
        'intradayBreakoutScanner',
        'goldenAlerts',
        'nearResistance',
        'supportReversal',
        'reactionZone',
        'stockData',
        'dailyNews',
        'tickerTape',
        'summaries',
        'playbackSnapshots',
        'exitTargetScreener',
        'weeklyRecommendation',
        'week52High',
        'week52Low'
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
    saveCacheToStorage(data);

    notifyListeners(data);

    console.log('Live data refreshed at:', new Date().toLocaleTimeString());
    return data;
  } catch (error) {
    console.error('Error refreshing data:', error);
    if (!cachedData) {
      setTimeout(() => refreshAllData(true), 3000);
    }
    return cachedData;
  }
}

export function startAutoRefresh(intervalMs: number = 15 * 60 * 1000): void {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  refreshAllData();

  refreshInterval = setInterval(() => {
    // Zero polling outside market hours unless inside the 22:30 EOD window
    if (!isMarketOpen() && !isEODWindow()) {
      return;
    }
    refreshAllData();
  }, intervalMs);

  console.log(`Auto-refresh started with ${intervalMs / 1000}s interval (market hours active)`);
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

export async function getWeek52High(): Promise<Week52HighStock[]> {
  const data = await refreshAllData();
  return data?.week52High || [];
}

export async function getWeek52Low(): Promise<Week52LowStock[]> {
  const data = await refreshAllData();
  return data?.week52Low || [];
}
