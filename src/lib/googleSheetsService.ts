const EOD_SHEET_ID = import.meta.env.VITE_LASA_EOD_SHEET_ID || '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';
const SWING_SHEET_ID = import.meta.env.VITE_SWING_BACKTEST_SHEET_ID || '1GEhcqN8roNR1F3601XNEDjQZ1V0OfSUtMxUPE2rcdNs';
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || '';
const USE_API_ROUTE = import.meta.env.PROD;

const REFRESH_INTERVAL = 15 * 60 * 1000;

interface CachedData<T> {
  data: T;
  timestamp: number;
}

let stockDataCache: CachedData<any[]> | null = null;
let marketMoodCache: CachedData<any> | null = null;
let marketStrengthCache: CachedData<any[]> | null = null;
let refreshTimer: ReturnType<typeof setInterval> | null = null;
let listeners: Set<() => void> = new Set();

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

function formatSheetDate(sheetName: string): string {
  const parts = sheetName.split('-');
  if (parts.length !== 3) return sheetName;
  const day = parseInt(parts[0]);
  const months: Record<string, string> = { 
    'JAN': 'Jan', 'FEB': 'Feb', 'MAR': 'Mar', 'APR': 'Apr', 'MAY': 'May', 'JUN': 'Jun', 
    'JUL': 'Jul', 'AUG': 'Aug', 'SEP': 'Sep', 'OCT': 'Oct', 'NOV': 'Nov', 'DEC': 'Dec' 
  };
  const month = months[parts[1].toUpperCase()] || 'Jan';
  return `${day}${getOrdinalSuffix(day)} ${month}`;
}

function parseSheetDate(name: string): Date {
  const p = name.split('-');
  if (p.length !== 3) return new Date(0);
  const months: Record<string, number> = { 
    'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5, 
    'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11 
  };
  let year = parseInt(p[2]);
  if (year < 100) year += 2000;
  return new Date(year, months[p[1].toUpperCase()], parseInt(p[0]));
}

function parseSwingDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const monthMap: Record<string, number> = {
    'jan': 0, 'january': 0, 'feb': 1, 'february': 1, 'mar': 2, 'march': 2,
    'apr': 3, 'april': 3, 'may': 4, 'jun': 5, 'june': 5,
    'jul': 6, 'july': 6, 'aug': 7, 'august': 7, 'sep': 8, 'september': 8,
    'oct': 9, 'october': 9, 'nov': 10, 'november': 10, 'dec': 11, 'december': 11
  };
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const monthStr = parts[0].toLowerCase();
  const day = parseInt(parts[1]);
  const month = monthMap[monthStr];
  if (month === undefined || isNaN(day)) return null;
  const year = new Date().getFullYear();
  const date = new Date(year, month, day);
  if (date > new Date()) {
    date.setFullYear(year - 1);
  }
  return date;
}

function formatSwingDate(dateStr: string): string {
  const date = parseSwingDate(dateStr);
  if (!date) return dateStr;
  const day = date.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day}${getOrdinalSuffix(day)} ${months[date.getMonth()]}`;
}

function rowsToObjects(rows: string[][]): Record<string, any>[] {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj: Record<string, any> = {};
    headers.forEach((header, i) => {
      obj[header] = row[i] !== undefined ? row[i] : null;
    });
    return obj;
  });
}

async function fetchSheetData(spreadsheetId: string, range: string): Promise<string[][]> {
  if (!API_KEY) {
    console.warn('No Google Sheets API key configured. Using cached JSON data.');
    throw new Error('API_KEY_MISSING');
  }
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.values || [];
}

async function fetchSheetMetadata(spreadsheetId: string): Promise<string[]> {
  if (!API_KEY) {
    throw new Error('API_KEY_MISSING');
  }
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${API_KEY}&fields=sheets.properties.title`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch metadata: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.sheets?.map((s: any) => s.properties.title) || [];
}

export async function fetchLiveStockData(): Promise<any[]> {
  try {
    const allSheets = await fetchSheetMetadata(EOD_SHEET_ID);
    const dateSheets = allSheets.filter(name => /^\d+-[A-Z]+-\d+$/i.test(name));
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const historySheets = dateSheets
      .filter(name => parseSheetDate(name) >= sixMonthsAgo)
      .sort((a, b) => parseSheetDate(b).getTime() - parseSheetDate(a).getTime());
    
    console.log(`Fetching ${historySheets.length} sheets for live data...`);
    
    const history: Record<string, any[]> = {};
    const BATCH_SIZE = 5;
    
    for (let i = 0; i < historySheets.length; i += BATCH_SIZE) {
      const batch = historySheets.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (sheetName) => {
        try {
          const rows = await fetchSheetData(EOD_SHEET_ID, `'${sheetName}'`);
          const data = rowsToObjects(rows);
          const sheetDate = parseSheetDate(sheetName);
          
          data.forEach(row => {
            const symbol = row['STOCK_NAME'];
            if (!symbol) return;
            if (!history[symbol]) history[symbol] = [];
            
            const closeStr = (row['CLOSE_PRICE'] || '').toString().replace(/,/g, '');
            const supportStr = (row['SUPPORT'] || '').toString().replace(/,/g, '');
            const resistanceStr = (row['RESISTANCE'] || '').toString().replace(/,/g, '');
            const mlFutStr = (row['ML_FUT_PRICE_20D'] || '').toString().replace(/,/g, '');
            const wolfeStr = (row['WOLFE_D'] || '').toString().replace(/,/g, '');
            const projFvgStr = (row['PROJ_FVG'] || '').toString().replace(/,/g, '');
            
            history[symbol].push({
              dateObj: sheetDate,
              sheetName,
              price: parseFloat(closeStr) || 0,
              rsi: parseFloat(row['RSI']) || 0,
              trend: row['DAILY_TREND'] || '',
              support: parseFloat(supportStr) || 0,
              resistance: parseFloat(resistanceStr) || 0,
              mlFutPrice20d: parseFloat(mlFutStr) || 0,
              wolfeD: parseFloat(wolfeStr) || 0,
              projFvg: parseFloat(projFvgStr) || 0,
              sector: row['SECTOR'] || ''
            });
          });
        } catch (err) {
          console.error(`Error fetching ${sheetName}:`, err);
        }
      }));
    }
    
    const masterList = Object.keys(history).map(symbol => {
      const stockHistory = history[symbol]
        .filter(h => h.dateObj && !isNaN(h.dateObj.getTime()))
        .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
      
      if (stockHistory.length === 0) return null;
      
      const latest = stockHistory[stockHistory.length - 1];
      return {
        symbol,
        name: symbol,
        sector: latest.sector,
        price: latest.price,
        rsi: latest.rsi,
        trend: latest.trend,
        history: stockHistory.map(h => ({
          price: h.price,
          rsi: h.rsi,
          trend: h.trend,
          support: h.support,
          resistance: h.resistance,
          mlFutPrice20d: h.mlFutPrice20d,
          wolfeD: h.wolfeD,
          projFvg: h.projFvg,
          date: formatSheetDate(h.sheetName)
        }))
      };
    }).filter(Boolean);
    
    stockDataCache = { data: masterList, timestamp: Date.now() };
    console.log(`Live stock data fetched: ${masterList.length} stocks`);
    return masterList;
  } catch (err: any) {
    console.warn('Falling back to local stock data due to error:', err.message);
    const staticData = await import('../data/processed/stock_data.json');
    return staticData.default;
  }
}

export async function fetchLiveMarketMood(): Promise<any> {
  try {
    const rows = await fetchSheetData(EOD_SHEET_ID, "'current'!A1:BZ");
    const moodData = rowsToObjects(rows);
    
    let bullish = 0, bearish = 0, neutral = 0;
    let validCount = 0;
    
    moodData.forEach(row => {
      const closeStr = (row['CLOSE_PRICE'] || '').toString().replace(/,/g, '');
      const resistanceStr = (row['RESISTANCE'] || '').toString().replace(/,/g, '');
      const supportStr = (row['SUPPORT'] || '').toString().replace(/,/g, '');
      
      const close = parseFloat(closeStr);
      const resistance = parseFloat(resistanceStr);
      const support = parseFloat(supportStr);
      
      if (isNaN(close) || isNaN(resistance) || isNaN(support) || close === 0) return;
      
      validCount++;
      
      if (close > 0.99 * resistance) {
        bullish++;
      } else if (close < 1.01 * support) {
        bearish++;
      } else {
        neutral++;
      }
    });
    
    const total = validCount || 1;
    const today = new Date();
    const day = today.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateStr = `${day}${getOrdinalSuffix(day)} ${months[today.getMonth()]}`;
    
    const marketMood = {
      bullish: (bullish / total) * 100,
      bearish: (bearish / total) * 100,
      neutral: (neutral / total) * 100,
      date: dateStr
    };
    
    marketMoodCache = { data: marketMood, timestamp: Date.now() };
    console.log('Live market mood fetched from current sheet:', marketMood);
    return marketMood;
  } catch (err: any) {
    console.warn('Falling back to local market mood due to error:', err.message);
    const staticData = await import('../data/processed/market_mood.json');
    return staticData.default;
  }
}

export async function fetchLiveMarketStrength(): Promise<any[]> {
  try {
    const rows = await fetchSheetData(SWING_SHEET_ID, 'DATA');
    const dataRows = rowsToObjects(rows);
    
    const strengthData = dataRows.map(row => ({
      dateObj: parseSwingDate(row['DATE']),
      dateStr: row['DATE'],
      rsi: parseFloat(row['NIFTY100_DAILY_RSI_ABOVE50']) || 50,
      ml_higher: parseFloat(row['ML_ABOVE']) || 0,
      ml_lower: parseFloat(row['ML_BELOW']) || 0,
      fg_above: parseFloat(row['FG_ABOVE']) || 0,
      fg_below: parseFloat(row['FG_BELOW']) || 0,
      fg_net: parseFloat(row['FG_NET']) || 0
    }))
      .filter(r => r.dateObj && !isNaN(r.dateObj.getTime()))
      .sort((a, b) => a.dateObj!.getTime() - b.dateObj!.getTime())
      .slice(-130)
      .map(r => ({
        date: formatSwingDate(r.dateStr),
        rsi: r.rsi,
        ml_higher: r.ml_higher,
        ml_lower: r.ml_lower,
        fg_above: r.fg_above,
        fg_below: r.fg_below,
        fg_net: r.fg_net
      }));
    
    marketStrengthCache = { data: strengthData, timestamp: Date.now() };
    console.log('Live market strength fetched:', strengthData.length, 'entries');
    return strengthData;
  } catch (err: any) {
    console.warn('Falling back to local market strength due to error:', err.message);
    const staticData = await import('../data/processed/market_strength.json');
    return staticData.default;
  }
}

async function fetchFromApiRoute(): Promise<{ stockData: any[], marketMood: any, marketStrength: any[] } | null> {
  try {
    const response = await fetch('/api/fetch-data');
    if (!response.ok) throw new Error('API route failed');
    const data = await response.json();
    return {
      stockData: data.stockData || [],
      marketMood: data.marketMood || null,
      marketStrength: data.marketStrength || []
    };
  } catch (err) {
    console.warn('API route fetch failed:', err);
    return null;
  }
}

export async function refreshAllData(): Promise<void> {
  console.log('Refreshing all data...');
  try {
    if (USE_API_ROUTE) {
      const apiData = await fetchFromApiRoute();
      if (apiData) {
        stockDataCache = { data: apiData.stockData, timestamp: Date.now() };
        marketMoodCache = { data: apiData.marketMood, timestamp: Date.now() };
        marketStrengthCache = { data: apiData.marketStrength, timestamp: Date.now() };
        console.log('Data refreshed from API route at', new Date().toLocaleTimeString());
        notifyListeners();
        return;
      }
    }
    
    await Promise.all([
      fetchLiveStockData(),
      fetchLiveMarketMood(),
      fetchLiveMarketStrength(),
      fetchLiveTopMovers(),
      fetchMarketPositionData()
    ]);
    console.log('All data refreshed successfully at', new Date().toLocaleTimeString());
    notifyListeners();
  } catch (err) {
    console.error('Error refreshing data:', err);
  }
}

function notifyListeners() {
  listeners.forEach(listener => listener());
}

export function subscribeToDataRefresh(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function startAutoRefresh(): void {
  if (refreshTimer) return;
  
  console.log(`Auto-refresh started: every ${REFRESH_INTERVAL / 60000} minutes`);
  
  refreshAllData();
  
  refreshTimer = setInterval(() => {
    refreshAllData();
  }, REFRESH_INTERVAL);
}

export function stopAutoRefresh(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
    console.log('Auto-refresh stopped');
  }
}

export function getLastRefreshTime(): Date | null {
  const timestamp = stockDataCache?.timestamp || marketMoodCache?.timestamp || marketStrengthCache?.timestamp;
  return timestamp ? new Date(timestamp) : null;
}

export function getCachedStockData(): any[] | null {
  return stockDataCache?.data || null;
}

export function getCachedMarketMood(): any | null {
  return marketMoodCache?.data || null;
}

export function getCachedMarketStrength(): any[] | null {
  return marketStrengthCache?.data || null;
}

export interface TopMover {
  id: string;
  stockName: string;
  changePercent: number;
  closePrice: number;
}

export interface TopMoversData {
  topGainers: TopMover[];
  topLosers: TopMover[];
}

let topMoversCache: CachedData<TopMoversData> | null = null;

export async function fetchLiveTopMovers(): Promise<TopMoversData> {
  try {
    const fullRows = await fetchSheetData(EOD_SHEET_ID, "'current'!A1:BZ");
    const data = rowsToObjects(fullRows);
    
    const stocks = data
      .filter(row => row['STOCK_NAME'] && row['CHANGE_PERCENT'] !== undefined && row['CHANGE_PERCENT'] !== '')
      .map(row => ({
        id: row['ID'] || row['STOCK_NAME'],
        stockName: row['STOCK_NAME'],
        changePercent: parseFloat((row['CHANGE_PERCENT'] || '0').toString().replace('%', '').replace(',', '')) || 0,
        closePrice: parseFloat((row['CLOSE_PRICE'] || '0').toString().replace(',', '')) || 0,
        marketCap: parseFloat((row['MARKETCAP'] || '0').toString().replace(',', '')) || 0
      }))
      .filter(s => !isNaN(s.changePercent) && !isNaN(s.closePrice));
    
    const top600ByMarketCap = [...stocks]
      .sort((a, b) => b.marketCap - a.marketCap)
      .slice(0, 600);
    
    const sortedByChange = [...top600ByMarketCap].sort((a, b) => b.changePercent - a.changePercent);
    
    const topGainers = sortedByChange.filter(s => s.changePercent > 0).slice(0, 10);
    const topLosers = sortedByChange.filter(s => s.changePercent < 0).slice(-10).reverse();
    
    const result: TopMoversData = { topGainers, topLosers };
    topMoversCache = { data: result, timestamp: Date.now() };
    console.log('Live top movers fetched (from top 600 by market cap):', topGainers.length, 'gainers,', topLosers.length, 'losers');
    return result;
  } catch (err: any) {
    console.warn('Error fetching top movers:', err.message);
    return { topGainers: [], topLosers: [] };
  }
}

export function getCachedTopMovers(): TopMoversData | null {
  return topMoversCache?.data || null;
}

export interface MarketPositionData {
  model: { bullish: number; bearish: number; neutral: number };
  balance: { above: number; below: number };
  momentum: { bullish: number; bearish: number };
  sr: { atSupport: number; atResistance: number; neutral: number };
  reversal: { up: number; down: number; neutral: number };
  lastUpdate: string;
}

let marketPositionCache: CachedData<MarketPositionData> | null = null;

export async function fetchMarketPositionData(): Promise<MarketPositionData> {
  try {
    const rows = await fetchSheetData(SWING_SHEET_ID, 'DATA');
    const dataRows = rowsToObjects(rows);
    
    if (dataRows.length === 0) {
      throw new Error('No data found in SWING_SHEET_ID DATA sheet');
    }

    const latest = dataRows[dataRows.length - 1];
    
    console.log('Available columns in DATA sheet:', Object.keys(latest));
    
    const mlAbove = parseFloat(latest['ML_ABOVE']) || 0;
    const mlBelow = parseFloat(latest['ML_BELOW']) || 0;
    const fgAbove = parseFloat(latest['FG_ABOVE']) || 0;
    const fgBelow = parseFloat(latest['FG_BELOW']) || 0;
    
      // MOMENTUM: NIFTY100_DAILY_RSI_ABOVE50 column shows % of stocks with RSI > 50 (bearish signal)
      // So bullish = 100 - that value, bearish = that value
      const rsiColumnValue = parseFloat(latest['NIFTY100_DAILY_RSI_ABOVE50']) || 0;
      const momentumBullish = 100 - rsiColumnValue;
      const momentumBearish = rsiColumnValue;
      
      // S/R: Just raw numbers, not percentages
      const totalSupport = parseFloat(latest['TOTAL_SUPPORT']) || 0;
      const totalResistance = parseFloat(latest['TOTAL_RESITANCE']) || parseFloat(latest['TOTAL_RESISTANCE']) || 0;
      
      const reversalUp = parseFloat(latest['REVERSAL_UP']) || 0;
      const reversalDown = parseFloat(latest['REVERSAL_DOWN']) || 0;
      
      console.log('Market Position - MODEL: ML_ABOVE:', mlAbove, 'ML_BELOW:', mlBelow);
      console.log('Market Position - BALANCE: FG_ABOVE:', fgAbove, 'FG_BELOW:', fgBelow);
      console.log('Market Position - MOMENTUM: RSI_COL:', rsiColumnValue, '-> Bullish:', momentumBullish, 'Bearish:', momentumBearish);
      console.log('Market Position - S/R: TOTAL_SUPPORT:', totalSupport, 'TOTAL_RESISTANCE:', totalResistance);
      console.log('Market Position - REVERSAL: UP:', reversalUp, 'DOWN:', reversalDown);

      const result: MarketPositionData = {
        model: {
          bullish: mlAbove,
          bearish: mlBelow,
          neutral: Math.max(0, 100 - (mlAbove + mlBelow))
        },
        balance: {
          above: fgAbove,
          below: fgBelow
        },
        momentum: {
          bullish: momentumBullish,
          bearish: momentumBearish
        },
        sr: {
          atSupport: totalSupport,
          atResistance: totalResistance,
          neutral: 0
        },
        reversal: {
          up: reversalUp,
          down: reversalDown,
          neutral: Math.max(0, 100 - (reversalUp + reversalDown))
        },
        lastUpdate: new Date().toLocaleTimeString()
      };
    
    marketPositionCache = { data: result, timestamp: Date.now() };
    console.log('Market position data fetched:', result);
    return result;
  } catch (err: any) {
    console.warn('Error fetching market position data:', err.message);
    
    if (marketPositionCache) {
      return marketPositionCache.data;
    }
    
    throw err;
  }
}

export function getCachedMarketPosition(): MarketPositionData | null {
  return marketPositionCache?.data || null;
}
