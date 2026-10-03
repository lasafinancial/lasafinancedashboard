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

// The last successful fetch is kept in IndexedDB so a fresh page load can render real data
// instantly instead of waiting on the network. (localStorage is capped at ~5 MB, which the
// payload exceeds, so saving there silently failed.)
//
// The data comes in two parts:
//   - live:      /api/fetch-data?part=live, fetched on every page load and refresh
//   - histories: /api/fetch-data?part=history, the daily price history of every stock,
//                which only changes once a day, so it's fetched at most once an hour
const LIVE_CACHE_KEY = 'live';
const HISTORY_CACHE_KEY = 'history';
const HISTORY_TTL = 60 * 60 * 1000; // 1 hour

type Histories = Record<string, any[]>;

let cachedData: GoogleSheetsData | null = null;
let lastFetchTime = 0;
let historyCache: Histories | null = null;
let historyFetchedAt = 0;

// Each stock's history from the live part holds only today's live point; prepend the cached
// daily history. If the server sent full histories (older server), leave them as they are.
function mergeHistories(data: GoogleSheetsData, histories: Histories | null): GoogleSheetsData {
  if (!histories || !Array.isArray(data.stockData)) return data;
  return {
    ...data,
    stockData: data.stockData.map((stock: any) => {
      const own = stock.history || [];
      if (!own.every((h: any) => h.isLive)) return stock;
      return { ...stock, history: [...(histories[stock.symbol] || []), ...own] };
    }),
  };
}

const cacheReady: Promise<void> = (async () => {
  try {
    // Old localStorage cache (usually failed to save anyway); free the space
    localStorage.removeItem('lasa_live_data_cache_v1');
    localStorage.removeItem('lasa_live_data_cache_time_v1');
  } catch {
    // Storage unavailable
  }
  const [live, history] = await Promise.all([
    idbGet<{ data: GoogleSheetsData; fetchedAt: number }>(LIVE_CACHE_KEY),
    idbGet<{ histories: Histories; fetchedAt: number }>(HISTORY_CACHE_KEY),
  ]);
  if (history?.histories) {
    historyCache = history.histories;
    historyFetchedAt = history.fetchedAt || 0;
  }
  // Only use the saved copy if nothing newer arrived from the network meanwhile
  if (live?.data && !cachedData) {
    cachedData = mergeHistories(live.data, historyCache);
    lastFetchTime = live.fetchedAt || 0;
    notifyListeners(cachedData);
  }
})();

let lastEODFetchDate: string | null = null;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes during market hours
const OFF_HOURS_CACHE_DURATION = 60 * 60 * 1000; // 1 hour outside market hours
let refreshInterval: ReturnType<typeof setInterval> | null = null;

const dataListeners: Set<(data: GoogleSheetsData) => void> = new Set();

import { getApiUrl } from '@/config/api';
import { idbGet, idbSet } from './idbCache';
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

// A cache saved while the backend sheets were mid-update can be missing key data
// (no prices, empty 52W lists, all-zero market mood). Such a cache shouldn't wait out the TTL.
const INCOMPLETE_CACHE_RETRY = 2 * 60 * 1000; // retry at most every 2 minutes
let lastIncompleteRefetchAttempt = 0;
// The saved copy is shown instantly, but every page load still fetches fresh data once.
let fetchedThisPageLoad = false;

function isCacheIncomplete(data: GoogleSheetsData): boolean {
  const stocks = data.stockData || [];
  if (stocks.length === 0) return true;
  const missingPrices = stocks.filter(s => !s.price).length;
  if (missingPrices > stocks.length / 2) return true;
  if (!data.week52High?.length && !data.week52Low?.length) return true;
  const mood = data.marketMood;
  if (!mood || (mood.bullish || 0) + (mood.bearish || 0) + (mood.neutral || 0) === 0) return true;
  return false;
}

// Many components call refreshAllData() at once on page load; share one in-flight request.
let inFlightRefresh: Promise<GoogleSheetsData | null> | null = null;
// After a failed fetch, retry once with growing delays (not forced) instead of every caller retrying.
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryDelay = 5000;
const MAX_RETRY_DELAY = 5 * 60 * 1000;

export function refreshAllData(force: boolean = false): Promise<GoogleSheetsData | null> {
  if (inFlightRefresh) return inFlightRefresh;
  inFlightRefresh = doRefreshAllData(force).finally(() => {
    inFlightRefresh = null;
  });
  return inFlightRefresh;
}

async function doRefreshAllData(force: boolean): Promise<GoogleSheetsData | null> {
  await cacheReady;
  const now = Date.now();
  const marketOpen = isMarketOpen();
  const eodWindow = isEODWindow();
  const todayKey = getISTDateKey();

  // Refetch an incomplete cache right away (rate-limited) instead of waiting for the TTL.
  // This only skips the client-side cache guards; it doesn't force a server-side sheet re-read.
  const refetchIncomplete = !force && !!cachedData && isCacheIncomplete(cachedData)
    && (now - lastFetchTime) >= INCOMPLETE_CACHE_RETRY
    && (now - lastIncompleteRefetchAttempt) >= INCOMPLETE_CACHE_RETRY;
  if (refetchIncomplete) {
    // Record the attempt up front so concurrent callers and failed fetches don't retry immediately
    lastIncompleteRefetchAttempt = now;
    console.log('[googleSheetsService] Cached data looks incomplete. Fetching fresh data.');
  }

  const skipCacheGuards = force || refetchIncomplete || !fetchedThisPageLoad;
  fetchedThisPageLoad = true;

  // Guard: Outside market hours, reuse the cache unless it's over an hour old
  // or the 22:30 EOD window is active (once per day).
  if (!skipCacheGuards && !marketOpen && cachedData && (now - lastFetchTime) < OFF_HOURS_CACHE_DURATION) {
    if (eodWindow && lastEODFetchDate !== todayKey) {
      console.log('[googleSheetsService] 22:30 IST EOD window active. Fetching once-a-day EOD data.');
    } else {
      console.log('[googleSheetsService] Market is closed. Skipping auto-refresh and using cached data.');
      return cachedData;
    }
  }

  // During market hours, respect the 15-minute cache TTL
  if (!skipCacheGuards && cachedData && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedData;
  }

  try {
    const baseUrl = getApiUrl('/api/fetch-data');
    const sep = baseUrl.includes('?') ? '&' : '?';
    const liveUrl = `${baseUrl}${sep}part=live${force ? '&force=true' : ''}`;
    const historyStale = !historyCache || (now - historyFetchedAt) >= HISTORY_TTL;

    const [response, historyResponse] = await Promise.all([
      fetch(liveUrl),
      historyStale ? fetch(`${baseUrl}${sep}part=history`).catch(() => null) : Promise.resolve(null),
    ]);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const liveData: GoogleSheetsData = await response.json();

    if (historyResponse?.ok) {
      try {
        const body = await historyResponse.json();
        if (body && body.histories && Object.keys(body.histories).length > 0) {
          historyCache = body.histories;
          historyFetchedAt = now;
          idbSet(HISTORY_CACHE_KEY, { histories: historyCache, fetchedAt: now });
        }
      } catch {
        // Keep the previous histories; retried on the next refresh
      }
    }

    const data: GoogleSheetsData = mergeHistories(liveData, historyCache);

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
    retryDelay = 5000;
    idbSet(LIVE_CACHE_KEY, { data: liveData, fetchedAt: now });

    notifyListeners(data);

    console.log('Live data refreshed at:', new Date().toLocaleTimeString());
    return data;
  } catch (error) {
    console.error('Error refreshing data:', error);
    if (!cachedData && !retryTimer) {
      retryTimer = setTimeout(() => {
        retryTimer = null;
        refreshAllData();
      }, retryDelay);
      retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY);
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
