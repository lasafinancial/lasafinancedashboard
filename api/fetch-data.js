import { google } from 'googleapis';
import { getGoogleCredentialsHelper } from './credentialsHelper.js';

const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';
const SWING_SHEET_ID = '1GEhcqN8roNR1F3601XNEDjQZ1V0OfSUtMxUPE2rcdNs';
const INDICES_SHEET_ID = '1EHB65PXFold-zCt-QkMzI_nfbZTuy4hEeS9G1naXhZQ';
const ALLSTOCKS_SHEET_ID = '1uibGhhv6Zdil2aWk17fcq1U-csYUffBdQv3Relrgfog';

const FEATURE_FLAGS = {
  ENABLE_BREAKOUT_SCREENER: false,       // Disables BREAKOUT (nearResistance) screener
  ENABLE_REVERSAL_SCREENER: false,       // Disables REVERSAL (supportReversal) screener
  ENABLE_REACTION_ZONE_SCREENER: false,   // Disables REACTION ZONE (reactionZone) screener
  ENABLE_NEW_BREAKOUTS_SCREENER: false,   // Disables NEW BREAKOUTS (newBreakouts) screener
};

function isMarketOpen() {
  const now = new Date();
  const istDateString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const istDate = new Date(istDateString);
  const day = istDate.getDay(); 
  const timeInMinutes = istDate.getHours() * 60 + istDate.getMinutes();
  return (day >= 1 && day <= 5) && (timeInMinutes >= 9 * 60 + 15 && timeInMinutes <= 15 * 60 + 30);
}

function getLogTimeIST() {
  return new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }) + " IST";
}

function parseDateFlexible(dateStr) {
  if (dateStr === null || dateStr === undefined || dateStr === '') return null;

  const num = Number(dateStr);
  if (!isNaN(num) && typeof dateStr !== 'boolean' && num > 40000) {
    const utc_days = Math.floor(num - 25569);
    return new Date(utc_days * 86400 * 1000);
  }

  const str = String(dateStr).trim();

  let date = new Date(str + 'T00:00:00');
  if (!isNaN(date.getTime())) return date;

  const parts = str.split(/[-\/]/);
  if (parts.length === 3) {
    const p = parts.map(part => parseInt(part, 10));

    if (p[0] > 1000) {
      date = new Date(p[0], p[1] - 1, p[2]);
      if (!isNaN(date.getTime())) return date;
    }

    if (p[2] > 1000) {
      date = new Date(p[2], p[1] - 1, p[0]);
      if (!isNaN(date.getTime())) return date;
    }

    date = new Date(p[2], p[0] - 1, p[1]);
    if (!isNaN(date.getTime())) return date;
  }

  date = new Date(str);
  if (!isNaN(date.getTime())) return date;

  return null;
}

function getCredentials() {
  return getGoogleCredentialsHelper();
}

function getOrdinalSuffix(day) {
  const d = parseInt(day);
  if (d > 3 && d < 21) return 'th';
  switch (d % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

function formatDate(dateInput) {
  if (!dateInput) return null;
  let date;
  if (dateInput instanceof Date) {
    date = dateInput;
  } else if (typeof dateInput === 'string') {
    date = new Date(dateInput);
  } else {
    return null;
  }
  if (isNaN(date.getTime())) return null;
  const day = date.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day}${getOrdinalSuffix(day)} ${months[date.getMonth()]}`;
}

function parseSwingDate(dateStr) {
  if (!dateStr) return null;
  const monthMap = {
    'jan': 0, 'january': 0, 'feb': 1, 'february': 1, 'mar': 2, 'march': 2,
    'apr': 3, 'april': 3, 'may': 4, 'jun': 5, 'june': 5,
    'jul': 6, 'july': 6, 'aug': 7, 'august': 7, 'sep': 8, 'september': 8,
    'oct': 9, 'october': 9, 'nov': 10, 'november': 10, 'dec': 11, 'december': 11
  };
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length < 2) return null;

  let day, monthStr, year;
  if (!isNaN(parseInt(parts[0]))) {
    day = parseInt(parts[0]);
    monthStr = parts[1].toLowerCase();
    year = parts[2] ? parseInt(parts[2]) : new Date().getFullYear();
  } else {
    monthStr = parts[0].toLowerCase();
    day = parseInt(parts[1]);
    year = parts[2] ? parseInt(parts[2]) : new Date().getFullYear();
  }

  const month = monthMap[monthStr];
  if (month === undefined || isNaN(day)) return null;
  return new Date(year, month, day);
}

function formatSwingDate(dateStr) {
  const date = parseSwingDate(dateStr);
  if (!date) return dateStr;
  const day = date.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day}${getOrdinalSuffix(day)} ${months[date.getMonth()]}`;
}

function getDynamicStatus(price, lowerRange, upperRange) {
  const actualMin = Math.min(price, lowerRange);
  const actualMax = Math.max(price, upperRange);
  const padding = (actualMax - actualMin) * 0.1;
  const displayMin = actualMin - padding;
  const displayMax = actualMax + padding;
  const displayRange = displayMax - displayMin;

  const pricePosition = displayRange > 0 ? ((price - displayMin) / displayRange) * 100 : 50;

  if (pricePosition > 66.66) return 'BULLISH';
  if (pricePosition < 33.33) return 'BEARISH';
  return 'NEUTRAL';
}

function colToIdx(col) {
  let idx = 0;
  for (let i = 0; i < col.length; i++) {
    idx = idx * 26 + (col.toUpperCase().charCodeAt(i) - 64);
  }
  return idx - 1;
}

function rowsToObjects(rows) {
  if (!rows || rows.length < 1) return [];
  const headers = rows[0].map(h => (h || '').toString().trim());
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      if (header) {
        obj[header] = row[i] !== undefined ? row[i] : null;
      }
    });
    // Normalize commonly used fields with fallback indexes
    if (!obj['STATUS']) obj['STATUS'] = row[colToIdx('BG')] || null;
    if (!obj['GROUP']) obj['GROUP'] = row[colToIdx('S')] || null;
    return obj;
  });
}

async function fetchData() {
  const getNum = (val) => {
    if (val === undefined || val === null || val === '') return 0;
    const strVal = val.toString().replace(/,/g, '');
    if (strVal.includes('#')) return 0;
    return parseFloat(strVal) || 0;
  };

  console.log('Fetching live data from Google Sheets...');
  const symbolAliasMap = {
    'TMPV': 'TMCV',
    'M&M': 'M&M'
  };
  const credentials = getCredentials();

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // --- BATCH FETCHING START ---
  console.log('Starting Batch 1 Fetches...');
  const safeFetch = (req) => sheets.spreadsheets.values.get(req).catch(e => { 
    console.error(`CRITICAL: Fetch error for ${req.range}`, e.message); 
    throw new Error(`Failed to fetch sheet range: ${req.range}`); 
  });
  
  const [
    goldenRes,
    lasaMasterRes,
    swingRes,
    currentRes,
    allstocksRes,
    indicesRes,
    newsRes,
    exitTargetScreenerRes,
    weeklyRecommendationRes
  ] = await Promise.all([
    safeFetch({ spreadsheetId: EOD_SHEET_ID, range: "'golden'" }),
    safeFetch({ spreadsheetId: EOD_SHEET_ID, range: 'lasa-master!A:FZ' }),
    safeFetch({ spreadsheetId: SWING_SHEET_ID, range: 'DATA' }),
    safeFetch({ spreadsheetId: EOD_SHEET_ID, range: "'current'!A1:FZ" }),
    sheets.spreadsheets.values.get({ spreadsheetId: ALLSTOCKS_SHEET_ID, range: "'allstocks'!A1:ZZ" }).catch(async () => {
      try {
        return await sheets.spreadsheets.values.get({ spreadsheetId: ALLSTOCKS_SHEET_ID, range: "'all stocks'!A1:ZZ" });
      } catch (e) {
        console.warn('Failed to fetch allstocks / all stocks tab:', e.message);
        return { data: { values: [] } };
      }
    }),
    safeFetch({ spreadsheetId: INDICES_SHEET_ID, range: 'Sheet1!A:Z' }),
    safeFetch({ spreadsheetId: INDICES_SHEET_ID, range: 'DAILY_NEWS!A:Z' }),
    safeFetch({ spreadsheetId: INDICES_SHEET_ID, range: "'RECOMMENDATION'!A:Z" }).catch(e => {
      console.warn('Failed to fetch RECOMMENDATION tab:', e.message);
      return { data: { values: [] } };
    }),
    safeFetch({ spreadsheetId: INDICES_SHEET_ID, range: "'WEEKLY-RECOMMENDATION'!A:AZ" }).catch(e => {
      console.warn('Failed to fetch WEEKLY-RECOMMENDATION tab:', e.message);
      return { data: { values: [] } };
    })
  ]);

  console.log('Starting Batch 2 Fetches...');
  const [
    summariesRes,
    niftyRes,
    breakoutRes,
    summaryRes,
    devRes,
    reversalRes
  ] = await Promise.all([
    safeFetch({ spreadsheetId: INDICES_SHEET_ID, range: 'Summaries!A:Z' }),
    safeFetch({ spreadsheetId: INDICES_SHEET_ID, range: 'DAILY_NIFTY_ANALYSIS!A:Z' }),
    safeFetch({ spreadsheetId: EOD_SHEET_ID, range: 'intraday-breakout-scanner!A:AC' }),
    safeFetch({ spreadsheetId: EOD_SHEET_ID, range: "'intraday-summary'!A1:Z500" }),
    safeFetch({ spreadsheetId: EOD_SHEET_ID, range: "'intraday-commentry'!A1:W5000" }),
    safeFetch({ spreadsheetId: EOD_SHEET_ID, range: "'intraday reversal live test'!A:I" })
  ]);
  console.log('Batch fetching complete.');
  // --- BATCH FETCHING END ---


  // --- Golden Alerts Fetch (Moved to top for reliability) ---
  let goldenAlerts = [];
  let intradaySummaryMap = {}; // Hoisted for global access within fetchData
  try {
    
    const goldenRows = goldenRes.data.values;
    console.log(`[GOLDEN] Raw fetch result: ${goldenRows ? goldenRows.length : 0} rows`);
    if (goldenRows && goldenRows.length > 0) {
      console.log(`[GOLDEN-DEBUG] Row 0: ${JSON.stringify(goldenRows[0])}`);
      console.log(`[GOLDEN-DEBUG] Last Row: ${JSON.stringify(goldenRows[goldenRows.length - 1])}`);
      const firstVal = (goldenRows[0][0] || '').toString().toLowerCase();
      const isHeader = firstVal.includes('symbol') || firstVal.includes('id') || firstVal.includes('date');
      const rowsToProcess = isHeader ? goldenRows.slice(1) : goldenRows;

      const deduplicated = new Map();
      // Get today's date as YYYY-MM-DD string (timezone-safe)
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      console.log(`[GOLDEN] Filtering for today: ${todayStr}`);

      // Helper for numeric time comparison (minutes from midnight)
      const getMinutes = (timeStr) => {
        if (!timeStr || typeof timeStr !== 'string') return 0;
        const parts = timeStr.trim().split(':');
        if (parts.length < 2) return 0;
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
      };

      rowsToProcess.forEach((row) => {
        const sym = (row[0] || '').toString().trim().toUpperCase();
        if (!sym || sym.length < 2 || sym === 'SYMBOL') return;

        // DATE FILTER (Column B / Index 1) - compare as string to avoid timezone issues
        const rawDate = (row[1] || '').toString().trim();
        if (rawDate) {
          // Normalize different date formats to YYYY-MM-DD using regex
          let normalizedDate = '';
          const serial = parseFloat(rawDate);
          if (!isNaN(serial) && serial > 40000 && !rawDate.includes('-') && !rawDate.includes('/')) {
            // Excel/Sheets serial number
            const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
            normalizedDate = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
          } else {
            // Flexible regex match for YYYY-MM-DD or DD-MM-YYYY or M-D-YYYY
            const match = rawDate.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/) || rawDate.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
            if (match) {
              if (match[1].length === 4) {
                // YYYY-MM-DD
                normalizedDate = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
              } else {
                // DD-MM-YYYY or MM-DD-YYYY — assume DD-MM-YYYY (Indian format)
                normalizedDate = `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
              }
            }
          }
          if (normalizedDate && normalizedDate !== todayStr) {
            return; // Skip alerts not from today
          }
        }

        const timeStr = (row[2] || '').toString().trim();
        const alert = {
          symbol: sym,
          time: timeStr,
          timeMinutes: getMinutes(timeStr),
          stars: (row[13] || '').toString(),
          note: (row[10] || '').toString(), // Column K: SIGNAL TYPE
          recommendedPrice: getNum(row[3]), // Column D: LTP (Recommended Price)
          change: getNum(row[5]), // Column F: PRICE PERCENT
          volumeMultiplier: getNum(row[4]), // Column E: VOL MULT
          resGap: getNum(row[8]), // Column I: RES GAP
          target: getNum(row[9]), // Column J: TARGET
          ema9: getNum(row[6]), // Column G: EMA9
          ema63: getNum(row[7]) // Column H: EMA63
        };

        if (!deduplicated.has(sym)) {
          deduplicated.set(sym, alert);
        } else {
          // Keep only the EARLIEST alert for each stock
          const existing = deduplicated.get(sym);
          if (alert.timeMinutes < existing.timeMinutes) {
            deduplicated.set(sym, alert);
          }
        }
      });
      goldenAlerts = Array.from(deduplicated.values());
      console.log(`[GOLDEN] Successfully processed ${goldenAlerts.length} alerts with 9 metrics`);
    }
  } catch (err) {
    console.warn('[GOLDEN] Early fetch error:', err.message);
  }

  let lasaMasterData = [];
  try {
    

    // Filter rows BEFORE converting to large object array to save memory
    const rawValues = lasaMasterRes.data.values || [];
    const groupIdx = colToIdx('S');
    const filteredRows = rawValues.filter((row, i) => {
      if (i === 0) return true; // Keep headers
      const g = (row[groupIdx] || '').toString().toUpperCase();
      return g === 'LARGECAP' || g === 'MIDCAP' || g === 'INDEX' || g === 'ETF' || g === 'SMALLCAP';
    });

    lasaMasterData = rowsToObjects(filteredRows);
    console.log(`Total rows kept (LARGECAP/MIDCAP/INDEX): ${lasaMasterData.length} (from ${rawValues.length} total)`);

    // Explicitly nullify large raw arrays to free memory
    rawValues.length = 0;
    filteredRows.length = 0;
  } catch (err) {
    console.warn('Failed to fetch from lasa-master, using fallback or empty:', err.message);
    lasaMasterData = [];
  }

  console.log(`Total rows fetched from lasa-master: ${lasaMasterData.length}`);

  const allDates = [...new Set(lasaMasterData.map(r => r['DATE']).filter(Boolean))];
  const sortedDates = allDates.sort((a, b) => new Date(b) - new Date(a));
  const latestDate = sortedDates[0];

  // Helper to calculate sentiment for a set of rows
  const calculateSentiment = (rows) => {
    const moodStocks = rows.filter(row => {
      const g = (row['GROUP'] || '').toString().toUpperCase();
      return g === 'LARGECAP' || g === 'MIDCAP';
    });
    let bull = 0, bear = 0, neut = 0;
    moodStocks.forEach(row => {
      const gn = (v) => parseFloat((v || '0').toString().replace(/,/g, '')) || 0;
      const cp = gn(row['CLOSE_PRICE'] || row[colToIdx('E')]);
      const res = gn(row['RESISTANCE'] || row[colToIdx('DI')]);
      const sup = gn(row['SUPPORT'] || row[colToIdx('DH')]);
      const st = getDynamicStatus(cp, sup, res);
      if (st === 'BULLISH') bull++; else if (st === 'BEARISH') bear++; else neut++;
    });
    if (moodStocks.length === 0) return { bullish: 0, bearish: 0, neutral: 0 };
    return {
      bullish: (bull / moodStocks.length) * 100,
      bearish: (bear / moodStocks.length) * 100,
      neutral: (neut / moodStocks.length) * 100
    };
  };

  const marketMood = { bullish: 0, bearish: 0, neutral: 0, date: formatDate(new Date(latestDate)), trend: [] };

  // Calculate trend for last 5 available dates in master
  const trendDates = sortedDates.slice(0, 5).reverse();
  marketMood.trend = trendDates.map(dateStr => {
    const dateRows = lasaMasterData.filter(r => r['DATE'] === dateStr);
    const sentiment = calculateSentiment(dateRows);
    return {
      date: formatDate(new Date(dateStr)),
      ...sentiment
    };
  }).filter(t => !(t.bullish === 0 && t.bearish === 0));

  console.log('Fetching Swing DATA sheet...');
  try {
    
    var dataRows = rowsToObjects(swingRes.data.values);
  } catch (err) {
    console.warn('Failed to fetch Swing DATA, using empty:', err.message);
    var dataRows = [];
  }

  const strengthData = dataRows.map(row => ({
    dateObj: parseSwingDate(row['DATE']),
    dateStr: row['DATE'],
    rsi: parseFloat(row['NIFTY100_DAILY_RSI_ABOVE50']) || 50,
    ml_higher: parseFloat(row['ML_ABOVE']) || 0,
    ml_lower: parseFloat(row['ML_BELOW']) || 0,
    fg_above: parseFloat(row['FG_ABOVE']) || 0,
    fg_below: parseFloat(row['FG_BELOW']) || 0,
    fg_net: parseFloat(row['FG_NET']) || 0,
    nifty50_close: parseFloat((row['NIFTY50_CLOSE'] || '').toString().replace(/,/g, '')) || 0,
    total_score: parseFloat(row['TOTAL_SCORE']) || 0,
    ml_threshold: parseFloat(row['ML_THRESHOLD']) || 0,
    momentum_oscillator: parseFloat(row['NIFTY100_DAILY_RSI_ABOVE50']) || 0
  }))
    .filter(r => r.dateObj && !isNaN(r.dateObj.getTime()))
    .sort((a, b) => a.dateObj - b.dateObj)
    .slice(-130)
    .map(r => ({
      date: formatSwingDate(r.dateStr),
      rsi: r.rsi,
      ml_higher: r.ml_higher,
      ml_lower: r.ml_lower,
      fg_above: r.fg_above,
      fg_below: r.fg_below,
      fg_net: r.fg_net,
      nifty50_close: r.nifty50_close,
      total_score: r.total_score,
      ml_threshold: r.ml_threshold,
      momentum_oscillator: r.momentum_oscillator
    }));

  const latestSwingData = dataRows[dataRows.length - 1] || {};
  const marketPosition = {
    model: {
      bullish: parseFloat(latestSwingData['ML_ABOVE']) || 0,
      bearish: parseFloat(latestSwingData['ML_BELOW']) || 0,
      neutral: Math.max(0, 100 - ((parseFloat(latestSwingData['ML_ABOVE']) || 0) + (parseFloat(latestSwingData['ML_BELOW']) || 0)))
    },
    balance: {
      above: parseFloat(latestSwingData['FG_ABOVE']) || 0,
      below: parseFloat(latestSwingData['FG_BELOW']) || 0
    },
    momentum: {
      bullish: 100 - (parseFloat(latestSwingData['NIFTY100_DAILY_RSI_ABOVE50']) || 0),
      bearish: parseFloat(latestSwingData['NIFTY100_DAILY_RSI_ABOVE50']) || 0
    },
    sr: {
      atSupport: parseFloat(latestSwingData['TOTAL_SUPPORT']) || 0,
      atResistance: parseFloat(latestSwingData['TOTAL_RESITANCE']) || parseFloat(latestSwingData['TOTAL_RESISTANCE']) || 0,
      neutral: 0
    },
    reversal: {
      up: parseFloat(latestSwingData['REVERSAL_UP']) || 0,
      down: parseFloat(latestSwingData['REVERSAL_DOWN']) || 0,
      neutral: Math.max(0, 100 - ((parseFloat(latestSwingData['REVERSAL_UP']) || 0) + (parseFloat(latestSwingData['REVERSAL_DOWN']) || 0)))
    },
    lastUpdate: new Date().toLocaleTimeString()
  };

  console.log('Processing stock history (180 days)...');
  const historyCutoff = new Date();
  historyCutoff.setDate(historyCutoff.getDate() - 180);
  historyCutoff.setHours(0, 0, 0, 0);

  const history = {};
  const resistanceSlopeMap = {};
  const fullNameMap = {};
  let parsedCount = 0;
  let skippedCount = 0;

  lasaMasterData.forEach(row => {
    const dateStr = row['DATE'];
    if (!dateStr) return;

    const group = (row['GROUP'] || '').toString().toUpperCase();
    if (group !== 'LARGECAP' && group !== 'MIDCAP' && group !== 'INDEX' && group !== 'ETF' && group !== 'SMALLCAP') {
      return;
    }

    const rowDate = parseDateFlexible(dateStr);
    if (!rowDate || rowDate < historyCutoff) {
      skippedCount++;
      return;
    }

    parsedCount++;
    const symbol = row['ID'] || row['STOCK_NAME'];
    if (!symbol) return;

    if (!fullNameMap[symbol]) {
      fullNameMap[symbol] = row['STOCK_NAME'] || symbol;
    }

    if (dateStr === latestDate) {
      const val = (row['RESISTANCE_SLOPE_DOWNWARD'] || '').toString().toLowerCase();
      resistanceSlopeMap[symbol] = val === 'true';
    }

    if (!history[symbol]) history[symbol] = [];

    const closeStr = (row['CLOSE_PRICE'] || '').toString().replace(/,/g, '');
    const supportStr = (row['SUPPORT'] || '').toString().replace(/,/g, '');
    const resistanceStr = (row['RESISTANCE'] || '').toString().replace(/,/g, '');
    const mlFutPriceStr = (row['ML_FUT_PRICE_20D'] || '').toString().replace(/,/g, '');
    const wolfeDStr = (row['WOLFE_D'] || '').toString().replace(/,/g, '');
    const projFvgStr = (row['PROJ_FVG'] || '').toString().replace(/,/g, '');

    history[symbol].push({
      dateObj: rowDate,
      dateDisplay: formatDate(rowDate),
      price: (!closeStr || closeStr.includes('#') || isNaN(parseFloat(closeStr))) ? null : parseFloat(closeStr),
      rsi: parseFloat(row['RSI']) || 0,
      trend: row['DAILY_TREND'] || '',
      support: parseFloat(supportStr) || 0,
      resistance: parseFloat(resistanceStr) || 0,
      mlFutPrice20d: parseFloat(mlFutPriceStr) || 0,
      wolfeD: parseFloat(wolfeDStr) || 0,
      projFvg: parseFloat(projFvgStr) || 0,
      sector: row['SECTOR'] || ''
    });
  });

  console.log(`History stats - Parsed: ${parsedCount}, Skipped: ${skippedCount}`);

  const stockData = Object.keys(history).map(symbol => {
    const stockHistory = history[symbol].sort((a, b) => a.dateObj - b.dateObj);
    if (stockHistory.length === 0) return null;
    const latest = stockHistory[stockHistory.length - 1];
    return {
      symbol,
      name: fullNameMap[symbol] || symbol,
      sector: latest.sector,
      price: latest.price,
      rsi: latest.rsi,
      trend: latest.trend,
      resistanceSlopeDownward: resistanceSlopeMap[symbol] || false,
      history: stockHistory.map(h => ({
        price: h.price,
        rsi: h.rsi,
        trend: h.trend,
        support: h.support,
        resistance: h.resistance,
        mlFutPrice20d: h.mlFutPrice20d,
        wolfeD: h.wolfeD,
        projFvg: h.projFvg,
        date: h.dateDisplay
      }))
    };
  }).filter(Boolean);

  console.log(`Final stockData count: ${stockData.length}`);

  console.log('Fetching Top Movers and Index Performance...');
  let topMovers = { topGainers: [], topLosers: [] };
  let indexPerformance = [];
  let nearResistance = [];
  let supportReversal = [];
  let reactionZone = [];
  let currentData = [];
  let dailyNews = [];
  let summaries = [];
  let nifty50Stocks = [];
  let intradayBreakout = [];
  let intradayBreakoutScanner = [];
  let intradayReversal = [];
  let intradayDev = [];
  let intradayDevChanges = [];
  let playbackSnapshots = [];
  let historicalBoTodayMap = {};
  let firstAppearanceMap = {};
  let niftyAnalysis = { history: [] };
  let currentPriceMap = new Map();
  let currentChangePercentMap = new Map();
  let currentObvSignalMap = new Map();
  let currentFrMap = new Map();

  let currentAllStocksPriceMap = new Map();
  let currentAllStocksModelMap = new Map();
  let currentAllStocksMlGapMap = new Map();

  // Fetch OBV_SIGNAL and CLOSE_PRICE exclusively from 'allstocks' tab (or fallback to 'lasa-master')
  try {
    const allstocksData = (allstocksRes && allstocksRes.data && allstocksRes.data.values && allstocksRes.data.values.length > 0)
      ? allstocksRes.data.values
      : (lasaMasterRes && lasaMasterRes.data && lasaMasterRes.data.values ? lasaMasterRes.data.values : []);
    if (allstocksData.length > 1) {
      const headers = allstocksData[0].map(h => (h || '').toString().trim().toUpperCase());
      
      let idIdx = headers.indexOf('SYMBOL');
      if (idIdx === -1) idIdx = headers.indexOf('ID');
      if (idIdx === -1) idIdx = colToIdx('C');

      let obvIdx = headers.indexOf('OBV_SIGNAL');
      if (obvIdx === -1) obvIdx = headers.indexOf('OBV SIGNAL');
      if (obvIdx === -1) obvIdx = headers.indexOf('OBV');
      if (obvIdx === -1) obvIdx = colToIdx('FO');

      let frIdx = headers.indexOf('OBV_DAILY_BREAKOUT');
      if (frIdx === -1) frIdx = headers.indexOf('FR');
      if (frIdx === -1) frIdx = headers.indexOf('OBV_DAILY');
      if (frIdx === -1) frIdx = colToIdx('FR');

      let modelIdx = colToIdx('AO');
      let mlGapIdx = colToIdx('FK');
      
      let closeIdx = headers.indexOf('CLOSE_PRICE');
      if (closeIdx === -1) closeIdx = headers.indexOf('LTP');
      if (closeIdx === -1) closeIdx = colToIdx('E');

      for (let i = 1; i < allstocksData.length; i++) {
        const rawRow = allstocksData[i];
        if (!rawRow || rawRow.length === 0) continue;

        const candidates = [
          idIdx !== -1 ? rawRow[idIdx] : null,
          rawRow[colToIdx('C')],
          rawRow[colToIdx('A')],
          rawRow[colToIdx('B')]
        ].filter(Boolean).map(s => s.toString().trim().toUpperCase());

        const uniqueSyms = new Set();
        candidates.forEach(c => {
          uniqueSyms.add(c);
          uniqueSyms.add(c.replace('.NS', ''));
          uniqueSyms.add(c.replace(/[^A-Z0-9]/g, ''));
          uniqueSyms.add(c.replace(/\s+/g, ''));
        });

        if (uniqueSyms.size > 0) {
          const obvSignal = (rawRow[obvIdx] || '').toString().trim();
          const frValue = (rawRow[frIdx] || '').toString().trim();
          const cp = parseFloat((rawRow[closeIdx] || '0').toString().replace(/,/g, ''));
          
          const rawModelStr = (rawRow[modelIdx] !== undefined ? rawRow[modelIdx] : (rawRow[colToIdx('AO')] || '0')).toString().trim();
          const modelVal = parseFloat(rawModelStr.replace(/,/g, ''));
          
          const rawMlStr = (rawRow[mlGapIdx] !== undefined ? rawRow[mlGapIdx] : (rawRow[colToIdx('FK')] || '')).toString().trim();
          let mlGapVal = NaN;
          if (rawMlStr) {
            mlGapVal = parseFloat(rawMlStr.replace('%', '').replace(/,/g, ''));
            if (!isNaN(mlGapVal)) {
              if (rawMlStr.includes('%') || Math.abs(mlGapVal) > 2) {
                mlGapVal = mlGapVal / 100;
              }
            }
          }

          uniqueSyms.forEach(sym => {
            if (sym) {
              if (obvSignal) currentObvSignalMap.set(sym, obvSignal);
              if (frValue) currentFrMap.set(sym, frValue);
              if (!isNaN(cp)) currentAllStocksPriceMap.set(sym, cp);
              if (!isNaN(modelVal) && modelVal > 0) currentAllStocksModelMap.set(sym, modelVal);
              if (!isNaN(mlGapVal)) currentAllStocksMlGapMap.set(sym, mlGapVal);
            }
          });
        }
      }

      stockData.forEach(s => {
        const symUpper = (s.symbol || '').toUpperCase();
        const symClean = symUpper.replace(/[^A-Z0-9]/g, '');
        s.obvSignal = currentObvSignalMap.get(symUpper) || currentObvSignalMap.get(symClean) || '—';
        s.fr = currentFrMap.get(symUpper) || currentFrMap.get(symClean) || '—';
      });

      console.log(`[OBV_SIGNAL] Extracted signals for ${currentObvSignalMap.size} stocks from allstocks tab.`);
    }
  } catch (err) {
    console.warn('Failed to parse allstocks for OBV signal:', err.message);
  }

  try {
    
    const currentRows = currentRes.data.values || [];
    currentData = rowsToObjects(currentRows);

    // Build currentPriceMap and currentChangePercentMap for later enrichment
    currentData.forEach(row => {
      const sym = (row['ID'] || row['C'] || '').toString().trim().toUpperCase();
      if (sym) {
        const cp = getNum(row['CLOSE_PRICE'] || row[colToIdx('E')]);
        currentPriceMap.set(sym, cp);

        const changePct = (parseFloat((row['CHANGE_PERCENT'] || row[colToIdx('BR')] || row[colToIdx('G')] || '0').toString().replace('%', '').replace(/,/g, '')) || 0) * 100;
        currentChangePercentMap.set(sym, changePct);

        
      }
    });

    const moodStocks = currentData.slice(0, 470).filter(row => {
      const group = (row['GROUP'] || '').toString().toUpperCase();
      return group === 'LARGECAP' || group === 'MIDCAP';
    });

    let bullCount = 0, bearCount = 0, neutCount = 0;
    moodStocks.forEach(row => {
      const closePrice = parseFloat((row['CLOSE_PRICE'] || '0').toString().replace(/,/g, '')) || 0;
      const upperRange = parseFloat((row['RESISTANCE'] || '0').toString().replace(/,/g, '')) || 0;
      const lowerRange = parseFloat((row['SUPPORT'] || '0').toString().replace(/,/g, '')) || 0;

      const status = getDynamicStatus(closePrice, lowerRange, upperRange);
      if (status === 'BULLISH') bullCount++;
      else if (status === 'BEARISH') bearCount++;
      else neutCount++;
    });

    const totalMoodStocks = moodStocks.length;
    if (totalMoodStocks > 0) {
      const sentiment = calculateSentiment(moodStocks);
      marketMood.bullish = sentiment.bullish;
      marketMood.bearish = sentiment.bearish;
      marketMood.neutral = sentiment.neutral;

      // Add current live point to trend
      const liveDate = formatDate(new Date());
      marketMood.trend = marketMood.trend.filter(t => t.date !== liveDate);
      marketMood.trend.push({
        date: `Live (${liveDate})`,
        ...sentiment
      });

      // Keep only last 6 points max
      if (marketMood.trend.length > 6) {
        marketMood.trend.shift();
      }
    }

    // --- Near Resistance, Support Reversal, and Reaction Zone Screeners ---
    nearResistance = [];
    supportReversal = [];
    reactionZone = [];

    if (FEATURE_FLAGS.ENABLE_BREAKOUT_SCREENER || FEATURE_FLAGS.ENABLE_REVERSAL_SCREENER || FEATURE_FLAGS.ENABLE_REACTION_ZONE_SCREENER) {
      const nearResistanceIdx = {
        ema200Status: colToIdx('EP'),
        id: colToIdx('C'),
        closePrice: colToIdx('E'),
        resistance: colToIdx('DI'),
        support: colToIdx('DH'),
        breakout: colToIdx('DU'),
        mlTargetPercent: colToIdx('FK'),
        algoB: colToIdx('EM'),
        algFgPercent: colToIdx('FI'),
        wProjection2: colToIdx('FJ'),
        algoFG: colToIdx('DJ'),
        algoM: colToIdx('AO'),
        algoW: colToIdx('AR'),
        changePercent: colToIdx('BR')
      };

      const mapStock = (row) => {
        const closePrice = getNum(row['CLOSE_PRICE'] || row[nearResistanceIdx.closePrice]);
        const symRaw = (row['ID'] || row['C'] || row['SYMBOL'] || row['STOCK_NAME'] || '').toString().trim().toUpperCase();
        
        const candidateKeys = [
          symRaw,
          symRaw.replace('.NS', ''),
          symRaw.replace(/[^A-Z0-9]/g, ''),
          symRaw.replace(/\s+/g, ''),
          (row['ID'] || '').toString().trim().toUpperCase(),
          (row['SYMBOL'] || '').toString().trim().toUpperCase(),
          (row['STOCK_NAME'] || '').toString().trim().toUpperCase(),
          (row[colToIdx('C')] || '').toString().trim().toUpperCase(),
          (row[colToIdx('A')] || '').toString().trim().toUpperCase(),
          (row[colToIdx('B')] || '').toString().trim().toUpperCase()
        ].filter(Boolean);

        let algoM = undefined;
        for (const k of candidateKeys) {
          if (currentAllStocksModelMap.has(k)) {
            algoM = currentAllStocksModelMap.get(k);
            break;
          }
        }
        if (algoM === undefined) {
          algoM = getNum(row['ML_FUT_PRICE_20D'] || row[nearResistanceIdx.algoM]);
        }

        let mlTargetPercent = undefined;
        for (const k of candidateKeys) {
          if (currentAllStocksMlGapMap.has(k)) {
            mlTargetPercent = currentAllStocksMlGapMap.get(k);
            break;
          }
        }
        if (mlTargetPercent === undefined) {
          if (closePrice > 0 && algoM > 0) {
            mlTargetPercent = (algoM - closePrice) / closePrice;
          } else {
            const rawFallback = getNum(row['ML_TARGET_PERCENT'] || row[nearResistanceIdx.mlTargetPercent]);
            mlTargetPercent = Math.abs(rawFallback) > 2 ? rawFallback / 100 : rawFallback;
          }
        }

        return {
          dEma200Status: (row['D-EMA-200-Status'] || row[nearResistanceIdx.ema200Status] || '').toString(),
          id: symRaw || (row['ID'] || '').toString(),
          closePrice: closePrice,
          resistance: getNum(row['RESISTANCE'] || row[nearResistanceIdx.resistance]),
          support: getNum(row['SUPPORT'] || row[nearResistanceIdx.support]),
          dBreakoutPrice: getNum(row['D_BREAKOUT_PRICE'] || row[nearResistanceIdx.breakout]),
          mlTargetPercent: mlTargetPercent,
          algoB: getNum(row['ALGO_B'] || row[nearResistanceIdx.algoB]),
          algFgPercent: getNum(row[nearResistanceIdx.algFgPercent]),
          wProjection2: getNum(row['W_PROJECTION_2'] || row[nearResistanceIdx.wProjection2]),
          wProjection3: 0,
          algoFG: getNum(row['PROJ_FVG'] || row[nearResistanceIdx.algoFG]),
          algoM: algoM,
          algoW: getNum(row['WOLFE_D'] || row[nearResistanceIdx.algoW]),
          changePercent: getNum(row['CHANGE_PERCENT'] || row[colToIdx('BR')] || row[colToIdx('G')])
        };
      };

      if (FEATURE_FLAGS.ENABLE_BREAKOUT_SCREENER) {
        nearResistance = currentData.filter(row => {
          const status = (row['STATUS'] || '').toString().toUpperCase();
          const group = (row['GROUP'] || '').toString().toUpperCase();
          return status === 'BULLISH' && (group === 'LARGECAP' || group === 'MIDCAP');
        }).map(mapStock).sort((a, b) => {
          if (a.dEma200Status === 'ABOVE' && b.dEma200Status !== 'ABOVE') return -1;
          if (a.dEma200Status !== 'ABOVE' && b.dEma200Status === 'ABOVE') return 1;
          return b.mlTargetPercent - a.mlTargetPercent;
        });
      }

      if (FEATURE_FLAGS.ENABLE_REVERSAL_SCREENER) {
        supportReversal = currentData.filter(row => {
          const group = (row['GROUP'] || '').toString().toUpperCase();
          const cp = getNum(row['CLOSE_PRICE'] || row[nearResistanceIdx.closePrice]);
          const sup = getNum(row['SUPPORT'] || row[nearResistanceIdx.support]);
          const brk = getNum(row['D_BREAKOUT_PRICE'] || row[nearResistanceIdx.breakout]);
          return (group === 'LARGECAP' || group === 'MIDCAP') && cp > sup && brk < sup;
        }).map(mapStock).sort((a, b) => {
          if (a.dEma200Status === 'ABOVE' && b.dEma200Status !== 'ABOVE') return -1;
          if (a.dEma200Status !== 'ABOVE' && b.dEma200Status === 'ABOVE') return 1;
          return b.mlTargetPercent - a.mlTargetPercent;
        });
      }

      if (FEATURE_FLAGS.ENABLE_REACTION_ZONE_SCREENER) {
        reactionZone = currentData.filter(row => {
          const group = (row['GROUP'] || '').toString().toUpperCase();
          const cp = getNum(row['CLOSE_PRICE'] || row[nearResistanceIdx.closePrice]);
          const algoFG = getNum(row['PROJ_FVG'] || row[nearResistanceIdx.algoFG]);
          const algoM = getNum(row['ML_FUT_PRICE_20D'] || row[nearResistanceIdx.algoM]);
          const algoW = getNum(row['WOLFE_D'] || row[nearResistanceIdx.algoW]);

          if (group !== 'LARGECAP' && group !== 'MIDCAP') return false;

          const nearFG = algoFG > 0 && Math.abs(cp - algoFG) <= (algoFG * 0.01);
          const nearM = algoM > 0 && Math.abs(cp - algoM) <= (algoM * 0.01);
          const nearW = algoW > 0 && Math.abs(cp - algoW) <= (algoW * 0.01);

          return nearFG || nearM || nearW;
        }).map(mapStock).sort((a, b) => b.mlTargetPercent - a.mlTargetPercent);
      }
    }

    // --- INDICES sheet: official stock lists per index (fixes 32→52 bug for NIFTY 50 etc.) ---
    const INDICES_SHEET_ID = '1EHB65PXFold-zCt-QkMzI_nfbZTuy4hEeS9G1naXhZQ';

    // Known display names (with proper spacing).
    const knownIndexDisplayNames = [
      'NIFTY 50', 'NIFTY BANK', 'NIFTY FINANCIAL SERVICES', 'NIFTY MIDCAP SELECT',
      'NIFTY NEXT 50', 'NIFTY 500', 'NIFTY MICROCAP 250', 'NIFTY SMALLCAP 250',
      'NIFTY MIDCAP 150', 'NIFTY LARGEMIDCAP', 'NIFTY AUTO', 'NIFTY CHEMICALS',
      'NIFTY CONSUMER DURABLES', 'NIFTY IT', 'NIFTY PHARMA', 'NIFTY METAL',
      'NIFTY FMCG', 'NIFTY INFRA', 'NIFTY PSU BANK', 'NIFTY PVT BANK', 'NIFTY CPSE',
    ];

    // Normalize: strip ALL spaces and uppercase — "NIFTY50" and "NIFTY 50" both → "NIFTY50"
    const norm = (s) => s.replace(/\s+/g, '').toUpperCase();

    // Build a lookup: norm(displayName) -> displayName
    const normToDisplayName = {};
    knownIndexDisplayNames.forEach(name => { normToDisplayName[norm(name)] = name; });

    // Build a map: displayName -> Set of stock IDs
    const indexStockIdSets = {};

    try {
      
      const indicesRows = indicesRes.data.values || [];
      if (indicesRows.length > 2) {
        // Headers are in row 2 (index 1)
        const indicesHeaders = indicesRows[1].map(h => (h || '').toString().trim());
        indicesHeaders.forEach((header, colIdx) => {
          if (!header) return;
          // Map raw sheet header (e.g. "NIFTY50") to display name (e.g. "NIFTY 50")
          const key = normToDisplayName[norm(header)] || header.trim();
          indexStockIdSets[key] = new Set();
          for (let rowIdx = 2; rowIdx < indicesRows.length; rowIdx++) {
            const cell = (indicesRows[rowIdx][colIdx] || '').toString().trim();
            if (cell) indexStockIdSets[key].add(cell.toUpperCase());
          }
        });
        console.log('INDICES sheet loaded. Keys: ' + Object.keys(indexStockIdSets).join(', '));
        console.log('INDICES sheet loaded. Keys: ' + Object.keys(indexStockIdSets).join(', '));
        console.log('NIFTY 50 count from INDICES: ' + ((indexStockIdSets['NIFTY 50'] || new Set()).size));
      }

    } catch (indErr) {
      console.warn('Could not fetch INDICES sheet, falling back to column flags:', indErr.message);
    }

    // --- 12. Fetch DAILY_NEWS tab (Independent) ---
    try {
      
      const newsRows = newsRes.data.values || [];
      if (newsRows.length > 1) {
        // Headers are in row 1
        const newsHeaders = newsRows[0].map(h => (h || '').toString().trim());
        const dateIdx = newsHeaders.indexOf('Date');
        const stockIdx = newsHeaders.indexOf('Stock');
        const companyIdx = newsHeaders.indexOf('Company');
        const newsTextIdx = newsHeaders.indexOf('News');
        const impactIdx = newsHeaders.indexOf('Impact');
        const reasonIdx = newsHeaders.indexOf('Reason');
        const sectorIdx = newsHeaders.indexOf('Sector');
        const sourceIdx = newsHeaders.indexOf('Source');

        const dateRegex = /^(\d{1,2}-[a-zA-Z]{3,9}-\d{2,4}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4}|\d{4}-\d{1,2}-\d{1,2})$/;
        for (let i = 1; i < newsRows.length; i++) {
          const row = newsRows[i];
          const rawDate = (row[dateIdx] || '').toString().trim();
          // Skip completely empty rows or rows with invalid dates
          if (!row || row.length === 0 || !rawDate || !dateRegex.test(rawDate)) continue;

          dailyNews.push({
            date: row[dateIdx] || '',
            stock: row[stockIdx] || '',
            company: row[companyIdx] || '',
            news: row[newsTextIdx] || '',
            impact: row[impactIdx] || '',
            reason: row[reasonIdx] || '',
            sector: row[sectorIdx] || '',
            source: row[sourceIdx] || ''
          });
        }
        console.log(`Fetched ${dailyNews.length} news items from DAILY_NEWS.`);
      }
    } catch (newsErr) {
      console.warn('Could not fetch DAILY_NEWS:', newsErr.message);
    }

    // --- 12b. Fetch Summaries tab (Independent) ---
    try {
      
      const summariesRows = summariesRes.data.values || [];
      if (summariesRows.length > 1) {
        const headers = summariesRows[0].map(h => (h || '').toString().trim());
        const stockIdx = headers.findIndex(h => h.toLowerCase() === 'stock');
        const cmpIdx = headers.findIndex(h => h.toLowerCase() === 'cmp');
        const dateIdx = headers.findIndex(h => h.toLowerCase() === 'data date');
        const balanceIdx = headers.findIndex(h => h.toLowerCase() === 'algo balance');
        const modelIdx = headers.findIndex(h => h.toLowerCase() === 'algo model');
        const patternIdx = headers.findIndex(h => h.toLowerCase() === 'algo pattern');
        const biasIdx = headers.findIndex(h => h.toLowerCase() === 'bias');
        const directionIdx = headers.findIndex(h => h.toLowerCase() === 'direction');
        const generatedIdx = headers.findIndex(h => h.toLowerCase() === 'generated at');

        const getVal = (row, idx) => idx !== -1 && row[idx] !== undefined ? row[idx] : '';

        for (let i = 1; i < summariesRows.length; i++) {
          const row = summariesRows[i];
          if (!row || row.length === 0 || !getVal(row, stockIdx)) continue;
          summaries.push({
            stock: getVal(row, stockIdx).toString().trim(),
            cmp: getVal(row, cmpIdx).toString().trim(),
            dataDate: getVal(row, dateIdx).toString().trim(),
            algoBalance: getVal(row, balanceIdx).toString().trim(),
            algoModel: getVal(row, modelIdx).toString().trim(),
            algoPattern: getVal(row, patternIdx).toString().trim(),
            bias: getVal(row, biasIdx).toString().trim(),
            direction: getVal(row, directionIdx).toString().trim(),
            generatedAt: getVal(row, generatedIdx).toString().trim()
          });
        }
        console.log(`Fetched ${summaries.length} summaries from Summaries tab.`);
      }
    } catch (sumErr) {
      console.warn('Could not fetch Summaries:', sumErr.message);
    }

    // --- 13. Fetch DAILY_NIFTY_ANALYSIS tab (Independent) ---
    try {
      
      const niftyRows = niftyRes.data.values || [];
      console.log(`DAILY_NIFTY_ANALYSIS fetch successful. Found ${niftyRows.length} rows.`);

      if (niftyRows.length > 0) {
        const blocks = [];
        let currentBlock = null;
        let scenarioNames = new Set();
        let currentSection = '';

        for (let i = 0; i < niftyRows.length; i++) {
          const row = niftyRows[i];
          if (!row || row.length === 0) continue;

          const dateMatch = (row[0] || '').toString().trim();
          // Broader date match: 13-Mar-2026, 13/03/2026, 13-03-2026, 2026-03-13, or 20-Apr-26
          const dateRegex = /^(\d{1,2}-[a-zA-Z]{3,9}-\d{2,4}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4}|\d{4}-\d{1,2}-\d{1,2})$/;
          const isDate = dateMatch && dateRegex.test(dateMatch);

          if (isDate && (!currentBlock || currentBlock.summary.date !== dateMatch)) {
            if (currentBlock) blocks.push(currentBlock);

            currentBlock = {
              summary: {
                date: dateMatch,
                marketMood: row[2] || '',
                niftyClose: row[4] || ''
              },
              scenarios: [],
              actionPlan: [],
              bottomLine: '',
              keyWatch: ''
            };
            scenarioNames = new Set();
            currentSection = '';
            continue;
          }

          if (!currentBlock) continue;

          const firstCell = (row[1] || '').toString().trim().toUpperCase();
          if (firstCell.includes('SCENARIO TABLE')) {
            currentSection = 'SCENARIOS';
            i++; // Skip header
            continue;
          } else if (firstCell.includes('TRADER ACTION PLAN')) {
            currentSection = 'ACTION_PLAN';
            i++; // Skip header
            continue;
          } else if (firstCell.includes('BOTTOM LINE')) {
            currentSection = 'BOTTOM_LINE';
            // Look across all columns in same row for content first
            const sameRowContent = row.slice(2).find(c => (c || '').toString().trim().length > 0);
            if (sameRowContent) {
              currentBlock.bottomLine = sameRowContent.toString().trim();
              currentSection = '';
            }
            continue;
          } else if (firstCell.includes('KEY WATCH')) {
            currentSection = 'KEY_WATCH';
            // Look across all columns in same row for content first
            const sameRowContent = row.slice(2).find(c => (c || '').toString().trim().length > 0);
            if (sameRowContent) {
              currentBlock.keyWatch = sameRowContent.toString().trim();
              currentSection = '';
            }
            continue;
          }

          if (currentSection === 'SCENARIOS' && row[1]) {
            const scenarioName = (row[1] || '').toString().trim();
            if (scenarioName && !scenarioNames.has(scenarioName)) {
              scenarioNames.add(scenarioName);
              currentBlock.scenarios.push({
                scenario: scenarioName,
                probability: row[2] || '',
                direction: row[3] || '',
                trigger: row[4] || '',
                target: row[5] || '',
                keyStocks: row[6] || ''
              });
            }
          } else if (currentSection === 'ACTION_PLAN' && row[1]) {
            currentBlock.actionPlan.push({
              traderType: (row[1] || '').toString().trim(),
              action: (row[2] || '').toString().trim(),
              detail: (row[3] || '').toString().trim(),
              keyLevels: (row[4] || '').toString().trim(),
              suggestedStocks: (row[5] || '').toString().trim()
            });
          } else if (currentSection === 'BOTTOM_LINE' && row[1]) {
            const content = (row[1] || '').toString().trim();
            // Don't take labels as content
            if (!content.includes('MARKET MOOD') && !content.includes('NIFTY') && content.length > 5) {
              currentBlock.bottomLine = content;
              currentSection = '';
            }
          } else if (currentSection === 'KEY_WATCH' && row[1]) {
            const content = (row[1] || '').toString().trim();
            if (!content.includes('MARKET MOOD') && !content.includes('NIFTY') && content.length > 5) {
              currentBlock.keyWatch = content;
              currentSection = '';
            }
          }
        }
        if (currentBlock) blocks.push(currentBlock);

        // Parse blocks and filter for the last 30 calendar days
        const parseBlockDate = (dateStr) => {
          if (!dateStr) return null;
          const parts = dateStr.trim().split('-');
          if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const months = {
              'jan': 0, 'january': 0, 'feb': 1, 'february': 1, 'mar': 2, 'march': 2,
              'apr': 3, 'april': 3, 'may': 4, 'jun': 5, 'june': 5,
              'jul': 6, 'july': 6, 'aug': 7, 'august': 7, 'sep': 8, 'september': 8,
              'oct': 9, 'october': 9, 'nov': 10, 'november': 10, 'dec': 11, 'december': 11
            };
            const month = months[parts[1].toLowerCase()];
            let year = parseInt(parts[2], 10);
            if (year < 100) year += 2000;
            if (month !== undefined && !isNaN(day) && !isNaN(year)) {
              return new Date(year, month, day);
            }
          }
          const d = new Date(dateStr);
          return isNaN(d.getTime()) ? null : d;
        };

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        let filteredBlocks = blocks.filter(b => {
          const bDate = parseBlockDate(b.summary.date);
          return bDate && bDate >= thirtyDaysAgo;
        });

        if (filteredBlocks.length === 0) {
          filteredBlocks = blocks.slice(-5); // Fallback: last 5 blocks
        }

        // Reverse blocks so the latest (last in sheet) is at index 0
        filteredBlocks.reverse();

        // niftyAnalysis will now be an array, or we keep it as an object with a 'history' property
        niftyAnalysis = { history: filteredBlocks };
        console.log(`Parsed Nifty Analysis: ${filteredBlocks.length} date blocks found (filtered to last 30 days).`);
      }
    } catch (niftyErr) {
      console.warn('Could not fetch DAILY_NIFTY_ANALYSIS:', niftyErr.message);
    }


    // Use INDICES sheet sets if available; otherwise fall back to old column-flag approach
    const useIndicesSheet = Object.keys(indexStockIdSets).length > 0;

    // Old fallback column map
    const indexColumns = {
      'NIFTY 50': 'NIFTY50',
      'NIFTY BANK': 'NIFTYBANK',
      'NIFTY IT': 'NIFTYIT',
      'NIFTY AUTO': 'NIFTYAUTO',
      'NIFTY PHARMA': 'NIFTYPHARMA',
      'NIFTY METAL': 'NIFTYMETAL',
      'NIFTY FMCG': 'NIFTYFMCG',
      'NIFTY INFRA': 'NIFTYINFRA',
      'NIFTY PSU BANK': 'NIFTYPSUBANK',
      'NIFTY PVT BANK': 'NIFTYPVTBANK',
      'NIFTY CPSE': 'NIFTYCPSE',
      'NIFTY 500': 'NIFTY500'
    };

    const indexNames = useIndicesSheet ? Object.keys(indexStockIdSets) : Object.keys(indexColumns);
    const indexStocksMap = {};
    indexNames.forEach(idx => {
      indexStocksMap[idx] = { stocks: [], bullish: 0, bearish: 0 };
    });

    // Build a lookup: stockId/stockName (uppercase) -> row data
    const latestLasaData = lasaMasterData.filter(row => row['DATE'] === latestDate);
    const stocksSource = currentData.length > 0 ? currentData : latestLasaData;
    const currentDataById = {};
    stocksSource.forEach(row => {
      const id = (row['ID'] || '').toString().trim().toUpperCase();
      const name = (row['STOCK_NAME'] || '').toString().trim().toUpperCase();
      if (id) currentDataById[id] = row;
      if (name && name !== id) currentDataById[name] = row;
    });

    if (useIndicesSheet) {
      // New approach: iterate over each index's known stock IDs and look them up in current data
      indexNames.forEach(indexName => {
        const idSet = indexStockIdSets[indexName];
        idSet.forEach(stockIdUpper => {
          const targetId = symbolAliasMap[stockIdUpper] || stockIdUpper;
          const row = currentDataById[targetId];
          if (!row) return;
          const stockName = row['STOCK_NAME'] || stockIdUpper;
          const closePrice = parseFloat((row['CLOSE_PRICE'] || '0').toString().replace(/,/g, '')) || 0;
          const stockId = row['ID'] || stockName;
          const upperRange = parseFloat((row['RESISTANCE'] || '0').toString().replace(/,/g, '')) || 0;
          const lowerRange = parseFloat((row['SUPPORT'] || '0').toString().replace(/,/g, '')) || 0;
          const dynamicStatus = getDynamicStatus(closePrice, lowerRange, upperRange);

          indexStocksMap[indexName].stocks.push({
            id: stockId,
            stockName,
            price: closePrice,
            status: dynamicStatus,
            upperRange,
            lowerRange
          });
          if (dynamicStatus === 'BULLISH') indexStocksMap[indexName].bullish++;
          if (dynamicStatus === 'BEARISH') indexStocksMap[indexName].bearish++;
        });
      });
    } else {
      // Old fallback: column-flag approach
      stocksSource.forEach(row => {
        const stockName = row['STOCK_NAME'];
        const closePrice = parseFloat((row['CLOSE_PRICE'] || '0').toString().replace(/,/g, '')) || 0;
        const stockId = row['ID'] || stockName;
        const upperRange = parseFloat((row['RESISTANCE'] || '0').toString().replace(/,/g, '')) || 0;
        const lowerRange = parseFloat((row['SUPPORT'] || '0').toString().replace(/,/g, '')) || 0;
        if (!stockName) return;
        const dynamicStatus = getDynamicStatus(closePrice, lowerRange, upperRange);
        Object.keys(indexColumns).forEach(indexName => {
          const colName = indexColumns[indexName];
          const val = row[colName];
          if (val && val.toString().trim() !== '' && val.toString().toUpperCase() !== 'FALSE') {
            indexStocksMap[indexName].stocks.push({ id: stockId, stockName, price: closePrice, status: dynamicStatus, upperRange, lowerRange });
            if (dynamicStatus === 'BULLISH') indexStocksMap[indexName].bullish++;
            if (dynamicStatus === 'BEARISH') indexStocksMap[indexName].bearish++;
          }
        });
      });
    }

    // Extract nifty50Stocks for the dedicated NIFTY 50 page
    nifty50Stocks = (indexStocksMap['NIFTY 50'] || { stocks: [] }).stocks;

    indexPerformance = Object.keys(indexStocksMap).map(indexName => {
      const data = indexStocksMap[indexName];
      // Apply alias mapping to stock IDs before processing
      const processedStocks = data.stocks.map(stock => {
        const aliasedId = symbolAliasMap[stock.id] || stock.id;
        // If the aliased ID points to a different stock, we might want to use its data
        // For now, we'll just update the ID in the stock object if an alias exists
        return { ...stock, id: aliasedId };
      });

      const total = processedStocks.length;
      const bullishCount = processedStocks.filter(s => s.status === 'BULLISH').length;
      const bearishCount = processedStocks.filter(s => s.status === 'BEARISH').length;
      const strengthScore = total > 0 ? Math.round((bullishCount / total) * 100) : 50;

      return {
        name: indexName,
        stocksCount: total,
        bullishCount: bullishCount,
        bearishCount: bearishCount,
        strengthScore,
        stocks: data.stocks
      };
    }).filter(idx => idx.stocksCount > 0).sort((a, b) => b.strengthScore - a.strengthScore);

    const stocks = currentData
      .filter(row => {
        if (!row['STOCK_NAME'] || row['CHANGE_PERCENT'] === undefined || row['CHANGE_PERCENT'] === '') return false;
        const group = (row['GROUP'] || '').toString().toUpperCase();
        return group === 'LARGECAP' || group === 'MIDCAP';
      })
      .map(row => ({
        id: row['ID'] || row[colToIdx('C')] || row['STOCK_NAME'] || row[colToIdx('D')],
        stockName: row['STOCK_NAME'] || row[colToIdx('D')],
        changePercent: parseFloat((row['CHANGE_PERCENT'] || row[colToIdx('BR')] || row[colToIdx('G')] || '0').toString().replace('%', '').replace(/,/g, '')) || 0,
        closePrice: parseFloat((row['CLOSE_PRICE'] || row[colToIdx('E')] || '0').toString().replace(/,/g, '')) || 0
      }))
      .filter(s => !isNaN(s.changePercent) && !isNaN(s.closePrice));

    const sortedByChange = [...stocks].sort((a, b) => b.changePercent - a.changePercent);

    topMovers = {
      topGainers: sortedByChange.filter(s => s.changePercent > 0).slice(0, 10),
      topLosers: sortedByChange.filter(s => s.changePercent < 0).slice(-10).reverse()
    };

    // --- Start Intraday Breakout Screener & Scanner ---
    historicalBoTodayMap = {};
    firstAppearanceMap = {};
    try {
      
      const breakoutRows = breakoutRes.data.values;
      if (breakoutRows && breakoutRows.length > 1) {
        const breakoutData = rowsToObjects(breakoutRows);
        const breakoutHeaders = breakoutRows[0];
        const boIdx = breakoutHeaders ? breakoutHeaders.findIndex(h => h && h.trim().toUpperCase() === 'BO_TODAY') : -1;
        const boColIdx = boIdx !== -1 ? boIdx : 28;

        const dates = [...new Set(breakoutRows.slice(1).map(r => r[1]).filter(Boolean))].sort((a, b) => new Date(b) - new Date(a));
        const latestDate = dates[0];

        breakoutRows.slice(1).forEach(r => {
          const sym = (r[0] || '').toString().trim().toUpperCase();
          const date = (r[1] || '').toString().trim();
          const timeStr = (r[2] || '').toString().trim();
          const boVal = (r[boColIdx] !== undefined && r[boColIdx] !== null) ? r[boColIdx].toString().trim() : '';

          if (!sym || (latestDate && date !== latestDate)) return;

          let h = 0, m = 0;
          try {
            const parts = timeStr.split(':');
            h = parseInt(parts[0], 10) || 0;
            m = parseInt(parts[1], 10) || 0;
          } catch (e) {}
          const timeMinutes = h * 60 + m;

          if (firstAppearanceMap[sym] === undefined || timeMinutes < firstAppearanceMap[sym]) {
            firstAppearanceMap[sym] = timeMinutes;
          }

          if (!historicalBoTodayMap[sym]) historicalBoTodayMap[sym] = [];

          historicalBoTodayMap[sym].push({
            timeMinutes: timeMinutes,
            val: boVal
          });
        });

        Object.keys(historicalBoTodayMap).forEach(sym => {
          historicalBoTodayMap[sym].sort((a, b) => a.timeMinutes - b.timeMinutes);
        });

        // 1. Old Intraday Breakout (Last 2 Trading Days)
        const allBreakoutDates = [...new Set(breakoutData.map(r => r['Date']).filter(Boolean))];
        const sortedBreakoutDates = allBreakoutDates.sort((a, b) => new Date(b) - new Date(a));
        const lastTwoDates = sortedBreakoutDates.slice(0, 2);

        const seenOld = new Set();
        intradayBreakout = breakoutData
          .filter(row => row['Date'] && lastTwoDates.includes(row['Date']))
          .filter(row => {
            const key = `${row['Symbol']}_${row['Time']}_${row['Date']}`;
            if (seenOld.has(key)) return false;
            seenOld.add(key);
            return true;
          })
          .map(row => {
            const getVal = (key, idx) => {
              const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
              return (foundKey ? row[foundKey] : row[idx]) || '';
            };

            return {
              symbol: getVal('Symbol', 0) || 'N/A',
              date: getVal('Date', 1) || 'N/A',
              time: getVal('Time', 2) || 'N/A',
              close: getNum(getVal('Close', 6)),
              Volume_multiplie: getNum(getVal('Volume_multiplie', 9)),
              'Price_%_Move': getNum(getVal('Price_%_Move', 10)),
              BALANCE: getVal('BALANCE', 12) || 'N/A',
              MODEL: getVal('MODEL', 13) || 'N/A',
              PATTERN: getVal('PATTERN', 14) || 'N/A',
              RESISTANCE: getVal('RESISTANCE', 16) || 'N/A'
            };
          })
          .sort((a, b) => {
            try {
              const dateA = new Date(`${a.date} ${a.time}`);
              const dateB = new Date(`${b.date} ${b.time}`);
              return dateB - dateA;
            } catch (e) {
              return 0;
            }
          });

        // 2. New Intraday Breakout Scanner (All Data, raw/full)
        const seenNew = new Set();
        intradayBreakoutScanner = breakoutData
          .filter(row => row['Symbol'] && row['Date'])
          .filter(row => {
            const key = `${row['Symbol']}_${row['Time']}_${row['Date']}`;
            if (seenNew.has(key)) return false;
            seenNew.add(key);
            return true;
          })
          .map(row => {
            const getVal = (key, idx) => {
              const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
              return (foundKey ? row[foundKey] : row[idx]) || '';
            };

            return {
              symbol: getVal('Symbol', 0) || 'N/A',
              date: getVal('Date', 1) || 'N/A',
              time: getVal('Time', 2) || 'N/A',
              pattern: getVal('PATTERN', 14) || 'N/A',
              resGap: getNum(getVal('Res_Gap%', 20)),
              target: getNum(getVal('Target', 21)),
              model: currentAllStocksModelMap.has((getVal('Symbol', 0) || '').toString().trim().toUpperCase()) ? currentAllStocksModelMap.get((getVal('Symbol', 0) || '').toString().trim().toUpperCase()) : (getVal('MODEL', 13) || 'N/A'),
              resistance: getNum(getVal('RESISTANCE', 16)),
              u: getNum(getVal('Price_%_Move', 10)),
              mlGap: currentAllStocksMlGapMap.has((getVal('Symbol', 0) || '').toString().trim().toUpperCase()) ? currentAllStocksMlGapMap.get((getVal('Symbol', 0) || '').toString().trim().toUpperCase()) : getNum(getVal('ML_GAP%', 27)),
              close: currentAllStocksPriceMap.has((getVal('Symbol', 0) || '').toString().trim().toUpperCase()) ? currentAllStocksPriceMap.get((getVal('Symbol', 0) || '').toString().trim().toUpperCase()) : getNum(getVal('Close', 6)),
              boPrice: getNum(getVal('Close', 6)),
              obvSignal: currentObvSignalMap.get((getVal('Symbol', 0) || '').toString().trim().toUpperCase()) || '—',
              fr: currentFrMap.get((getVal('Symbol', 0) || '').toString().trim().toUpperCase()) || '—'
            };
          })
          .sort((a, b) => {
            try {
              const dateA = new Date(`${a.date} ${a.time}`);
              const dateB = new Date(`${b.date} ${b.time}`);
              return dateB - dateA;
            } catch (e) {
              return 0;
            }
          });
      }
    } catch (err) {
      console.warn('Could not fetch intraday breakout data:', err.message);
    }
    // --- End Intraday Breakout Screener & Scanner ---

    // --- Start Intraday Reversal Screener ---
    try {
      const reversalRows = reversalRes.data.values;
      if (reversalRows && reversalRows.length > 1) {
        const headers = reversalRows[0].map(h => (h || '').toString().trim());
        const dateIdx = headers.indexOf('Date');
        const detectedIdx = headers.indexOf('Reversal Detected at');
        const symbolIdx = headers.indexOf('Symbol');
        const breakoutTimeIdx = headers.indexOf('Breakout Time');
        const breakoutPriceIdx = headers.indexOf('Breakout Price');
        const haCloseIdx = headers.indexOf('HA Close');
        const dropIdx = headers.indexOf('% Drop from High');
        const candlesIdx = headers.indexOf('Candles since Breakout');
        const candleTimeIdx = headers.indexOf('Reversal Candle Time');

        const getVal = (row, idx) => idx !== -1 && row[idx] !== undefined ? row[idx] : '';

        for (let i = 1; i < reversalRows.length; i++) {
          const row = reversalRows[i];
          if (!row || row.length === 0 || !getVal(row, symbolIdx)) continue;
          intradayReversal.push({
            date: getVal(row, dateIdx).toString().trim(),
            reversalDetectedAt: getVal(row, detectedIdx).toString().trim(),
            symbol: getVal(row, symbolIdx).toString().trim().toUpperCase(),
            breakoutTime: getVal(row, breakoutTimeIdx).toString().trim(),
            breakoutPrice: getNum(getVal(row, breakoutPriceIdx)),
            haClose: getNum(getVal(row, haCloseIdx)),
            dropFromHigh: getNum(getVal(row, dropIdx)),
            candlesSinceBreakout: getNum(getVal(row, candlesIdx)),
            reversalCandleTime: getVal(row, candleTimeIdx).toString().trim(),
            obvSignal: currentObvSignalMap.get(getVal(row, symbolIdx).toString().trim().toUpperCase()) || '—',
            fr: currentFrMap.get(getVal(row, symbolIdx).toString().trim().toUpperCase()) || '—'
          });
        }
        console.log(`Fetched ${intradayReversal.length} records from intraday reversal live test.`);
      }
    } catch (err) {
      console.warn('Could not fetch intraday reversal data:', err.message);
    }
    // --- End Intraday Reversal Screener ---

    // --- Start Intraday Summary (Stars & Tiers) ---
    // (intradaySummaryMap already defined at top)
    try {
      const summaryRows = summaryRes.data.values;
      if (!summaryRows || summaryRows.length <= 1) {
        throw new Error('Intraday Summary is empty (likely mid-update). Failing to preserve frontend cache.');
      }
      if (summaryRows && summaryRows.length > 1) {
        summaryRows.slice(1).forEach(row => {
          const symbol = (row[1] || '').toString().trim().toUpperCase(); // Column B
          if (!symbol) return;
          intradaySummaryMap[symbol] = {
            stars: (row[0] || '').toString().trim(),      // Column A
            tier: (row[3] || 'DEVELOPING').toString().trim().toUpperCase(), // Column D
            target: (row[9] || '').toString().trim(),     // Column J
            targetPrice: parseFloat((row[10] || '0').toString().replace(/[^0-9.]/g, '')) || 0, // Column K
            resistance: parseFloat((row[12] || '0').toString().replace(/[^0-9.]/g, '')) || 0, // Column M
            ema9: getNum(row[7]),  // Column H
            ema63: getNum(row[8]), // Column I
            changePercent: parseFloat((row[5] || '0').toString().replace('%', '').replace(/,/g, '')) || 0, // Column F
            targetStr: (row[9] || '').toString().trim(), // Column J
            emaCrossover: (row[8] || '').toString().trim(), // Column I
            reasons: (row[15] || '').toString().trim(),      // Column P
            valV: (row[21] || '').toString().trim(),         // Column V
            valW: (row[22] || '').toString().trim()          // Column W
          };
        });
        console.log(`[INTRADAY-SUMMARY] Loaded ${Object.keys(intradaySummaryMap).length} symbols from summary sheet.`);
      }
    } catch (err) {
      console.warn('Could not fetch intraday-summary data:', err.message);
      throw err;
    }

    // --- Start Intraday Dev (Commentary) Screener ---
    try {
      const devRows = devRes.data.values;
      if (!devRows || devRows.length <= 1) {
        throw new Error('Intraday Commentary is empty (likely mid-update). Failing to preserve frontend cache.');
      }
      if (devRows && devRows.length > 1) {
        const rawDevData = rowsToObjects(devRows);
        const symbolStates = {};
        const symbolNotes = {};
        const recentChanges = [];

        // Record a change only if the state OR the note/commentary changes
        rawDevData.forEach(row => {
          const symbol = (row['Symbol'] || row['ID'] || row[0] || '').toString().trim();
          if (!symbol || symbol === 'N/A' || symbol === 'Symbol' || symbol === 'Date') return;

          const currentState = (row['State'] || row['N (State)'] || row[13] || 'STRONG').toString().toUpperCase();
          const time = (row['Time'] || row[2] || 'N/A').toString();
          const note = (row['Note'] || row[15] || row['Event'] || row[14] || '').toString();

          const hasStateChange = !symbolStates[symbol] || symbolStates[symbol] !== currentState;
          const hasNoteChange = symbolNotes[symbol] !== note;

          if (hasStateChange || hasNoteChange) {
            recentChanges.push({
              symbol,
              fromState: symbolStates[symbol] || 'NONE',
              toState: currentState,
              time,
              note,
              price: getNum(row['Close'] || row[7])
            });
            symbolStates[symbol] = currentState;
            symbolNotes[symbol] = note;
          }
        });

        // Grouping for the latest status columns (Strong, Pullback, Exit)
        const groupedRows = {};
        devRows.slice(1).forEach(row => {
          const symbol = (row[0] || '').toString().trim();
          if (!symbol || symbol === 'N/A' || symbol === 'Symbol' || symbol === 'Date') return;
          if (!groupedRows[symbol]) groupedRows[symbol] = [];
          groupedRows[symbol].push(row);
        });

        intradayDev = Object.values(groupedRows).map(symbolRows => {
          const latest = symbolRows[symbolRows.length - 1];
          const sym = (latest['Symbol'] || latest[0] || 'N/A').toString().trim().toUpperCase();
          const latestState = (latest['State'] || latest['N (State)'] || latest[12] || 'STRONG').toString().toUpperCase();
          const summary = intradaySummaryMap[sym] || {};
          const scannerData = intradayBreakoutScanner.find(s => s.symbol.toUpperCase() === sym) || {};

          // Find the LATEST non-empty value for each field (in case of truncated rows)
          const findLatest = (idx) => {
            for (let i = symbolRows.length - 1; i >= 0; i--) {
              const val = (symbolRows[i][idx] || '').toString().trim();
              if (val) return val;
            }
            return '';
          };

          // Check if this stock is a new breakout in the last 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          thirtyDaysAgo.setHours(0,0,0,0);
          
          const today = new Date();
          today.setHours(0,0,0,0);

          const historicalAppearances = intradayBreakoutScanner.filter(s => {
            if (s.symbol.toUpperCase() !== sym) return false;
            let d = new Date(s.date);
            if (isNaN(d.getTime())) {
                const parts = (s.date||'').trim().split('-');
                if (parts.length === 3) {
                    const months = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
                    const m = months[parts[1].toLowerCase().substring(0,3)];
                    if (m !== undefined) {
                        let y = parseInt(parts[2], 10);
                        if (y < 100) y += 2000;
                        d = new Date(y, m, parseInt(parts[0], 10));
                    }
                }
            }
            if (isNaN(d.getTime())) return false;
            return d < today && d >= thirtyDaysAgo;
          });
          const isNew = historicalAppearances.length === 0;

          return {
            symbol: sym,
            date: (latest[1] || 'N/A').toString(),
            time: (latest[1] || 'N/A').toString(),
            open: getNum(findLatest(2)),
            high: getNum(findLatest(3)),
            low: getNum(findLatest(4)),
            close: getNum(findLatest(5)),
            volume: getNum(findLatest(6)),
            volMult: getNum(findLatest(8)),
            changePercent: currentChangePercentMap.has(sym) ? currentChangePercentMap.get(sym) : (summary.changePercent || 0),
            isGreen: (findLatest(7) || '').toString(),
            tier: summary.tier || (findLatest(12) ? 'MODERN' : 'DEVELOPING'),
            stars: summary.stars || '',
            targetPrice: scannerData.target || summary.targetPrice || 0,
            summaryTarget: summary.target || '',
            resistance: scannerData.resistance || summary.resistance || 0,
            MODEL: scannerData.model || 0,
            state: latestState,
            event: (findLatest(13) || '').toString(),
            note: (findLatest(15) || '').toString(),
            ema9: getNum(findLatest(9)),
            ema63: getNum(findLatest(10)),
            emaCrossover: findLatest(11),
            targetStr: findLatest(17),
            reasons: findLatest(14),
            valV: (latest[20] !== undefined && latest[20] !== null && latest[20] !== '') ? latest[20].toString().trim() : (summary.valV || ''),
            valW: (latest[21] !== undefined && latest[21] !== null && latest[21] !== '') ? latest[21].toString().trim() : (summary.valW || ''),
            obvSignal: currentObvSignalMap.get(sym) || '—',
            fr: currentFrMap.get(sym) || '—',
            priceMove: scannerData.u !== undefined ? scannerData.u : 0,
            allSignals: symbolRows.length,
            isNew: isNew,
            recentChanges: recentChanges.filter(c => c.symbol === sym)
          };
        });
        if (intradayDev.length === 0) throw new Error('Intraday Commentary parsed 0 valid stocks.');
        // Sort all changes by time descending so the latest signals from ANY stock appear at top
        const parseTime = (t) => {
          try {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
          } catch { return 0; }
        };
        intradayDevChanges = [...recentChanges]
          .sort((a, b) => parseTime(b.time) - parseTime(a.time))
          .slice(0, 50);

        // --- NEW: Playback Snapshots Builder ---
        // 1. Get unique timestamps from all data
        const uniqueTimes = [...new Set(rawDevData.map(row => (row['Time'] || row[2] || 'N/A').toString()))]
          .filter(t => t !== 'N/A')
          .sort((a, b) => parseTime(a) - parseTime(b));

        // 2. Take the last 20 timestamps for the 5-minute history (assuming 1-5 min intervals)
        const playbackTimes = uniqueTimes; // Include all timestamps from 9:15 AM onwards

        const getHistoricalBoToday = (sym, targetTimeStr, fallbackVal) => {
          const entries = historicalBoTodayMap[sym];
          if (!entries || entries.length === 0) return fallbackVal;
          let targetMin = 0;
          try {
            const parts = targetTimeStr.split(':');
            targetMin = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
          } catch (e) {}
          let bestVal = null;
          for (let i = 0; i < entries.length; i++) {
            if (entries[i].timeMinutes <= targetMin) {
              if (entries[i].val !== '') {
                bestVal = entries[i].val;
              }
            } else {
              break;
            }
          }
          return (bestVal !== null && bestVal !== undefined && bestVal !== '') ? bestVal : fallbackVal;
        };

        playbackSnapshots = playbackTimes.map(timePoint => {
          const snapshotState = {};
          const timePointParsed = parseTime(timePoint);
          // Find the latest record for each symbol up to this time point using RAW ARRAYS
          devRows.slice(1).forEach(row => {
            const rowTime = (row[1] || 'N/A').toString();
            if (parseTime(rowTime) <= timePointParsed) {
              const symbol = (row[0] || '').toString().trim().toUpperCase();
              if (!symbol || symbol === 'N/A') return;

              // Stock Eligibility Check: Stock must have appeared in intraday-breakout-scanner at or before timePoint
              const firstMin = firstAppearanceMap[symbol];
              if (firstMin === undefined || firstMin > timePointParsed) {
                return;
              }

              snapshotState[symbol] = row;
            }
          });

          const stocksAtTime = Object.values(snapshotState).map(latest => {
            const sym = (latest[0] || 'N/A').toString().trim().toUpperCase();
            const summary = intradaySummaryMap[sym] || {};
            const scannerData = intradayBreakoutScanner.find(s => s.symbol.toUpperCase() === sym) || {};
            const defaultValV = (latest[20] !== undefined && latest[20] !== null && latest[20] !== '') ? latest[20].toString().trim() : (summary.valV || '');
            const histValV = getHistoricalBoToday(sym, timePoint, defaultValV);
            // Indices: 0:Sym, 1:Time, 5:Close, 9:EMA9, 10:EMA63, 11:Crossover, 12:State, 14:Reason, 17:Target
            return {
              symbol: sym,
              time: (latest[1] || 'N/A').toString(),
              close: getNum(latest[5]),
              changePercent: currentChangePercentMap.has(sym) ? currentChangePercentMap.get(sym) : (summary.changePercent || 0),
              state: (latest[12] || 'STRONG').toString().toUpperCase(),
              tier: summary.tier || 'DEVELOPING',
              stars: summary.stars || '',
              targetPrice: scannerData.target || summary.targetPrice || 0,
              summaryTarget: summary.target || '',
              resistance: scannerData.resistance || summary.resistance || 0,
              MODEL: scannerData.model || 0,
              event: (latest[13] || '').toString(),
              note: (latest[15] || '').toString(),
              entry: getNum(latest[15]),
              stop: getNum(latest[16]),
              target: getNum(latest[17]),
              rr: getNum(latest[18]),
              ema9: getNum(latest[9] || 0),
              ema63: getNum(latest[10] || 0),
              emaCrossover: (latest[11] || '').toString().trim(),
              targetStr: (latest[17] || '').toString().trim(),
              reasons: (latest[14] || '').toString().trim(),
              valV: histValV,
              valW: summary.valW || ''
            };
          });

          const changesAtTime = [...recentChanges]
            .filter(c => parseTime(c.time) <= timePointParsed)
            .sort((a, b) => parseTime(b.time) - parseTime(a.time))
            .slice(0, 50);

          return {
            time: timePoint,
            stocks: stocksAtTime,
            changes: changesAtTime
          };
        });
      }
    } catch (err) {
      console.warn('Could not fetch intraday dev data:', err.message);
      throw err;
    }
    // --- End Intraday Dev Screener ---

  } catch (err) {
    console.warn('Could not fetch top movers from current tab:', err.message);
  }

  // --- Link Current Live Data to Stock History ---
  const currentLiveMap = {};
  currentData.forEach(row => {
    const symbol = row['ID'] || row['STOCK_NAME'];
    if (symbol) currentLiveMap[symbol] = row;
  });

  const finalStockData = stockData.map(stock => {
    const liveRow = currentLiveMap[stock.symbol];
    if (liveRow && stock.history.length > 0) {
      const liveDate = formatDate(new Date());
      const cp = getNum(liveRow['CLOSE_PRICE'] || liveRow[colToIdx('E')]);

      // Update main stock price with live value
      stock.price = cp;

      // Append live point - ONLY price should extend on the chart
      stock.history.push({
        date: `${liveDate} (LIVE)`,
        price: cp,
        support: null,
        resistance: null,
        mlFutPrice20d: null,
        wolfeD: null,
        projFvg: null,
        rsi: null,
        trend: null,
        isLive: true
      });
    }
    return stock;
  });

  // --- Final Golden Alerts Enrichment with Live Prices ---
  if (goldenAlerts && goldenAlerts.length > 0) {
    goldenAlerts = goldenAlerts.map(alert => {
      let livePrice = alert.recommendedPrice;

      // Priority 1: 'current' sheet (TRULY LIVE)
      if (currentPriceMap.has(alert.symbol)) {
        livePrice = currentPriceMap.get(alert.symbol);
      }
      // Priority 2: stockData (Historical/Master fallback)
      else if (finalStockData && finalStockData.length > 0) {
        const matched = finalStockData.find(s => s.symbol.toUpperCase() === alert.symbol);
        if (matched) livePrice = matched.price;
      }

      if (intradaySummaryMap[alert.symbol]) {
        alert.valV = intradaySummaryMap[alert.symbol].valV;
        alert.valW = intradaySummaryMap[alert.symbol].valW;
      }

      return {
        ...alert,
        livePrice
      };
    });
  }

  // --- Attach OBV signals to every stockData item right before return ---
  // This runs unconditionally, after all data is loaded, guaranteeing the fields exist.
  finalStockData.forEach(s => {
    const symUpper = (s.symbol || '').toUpperCase();
    const symClean = symUpper.replace(/[^A-Z0-9]/g, '');
    if (!s.obvSignal || s.obvSignal === '—') {
      s.obvSignal = currentObvSignalMap.get(symUpper) || currentObvSignalMap.get(symClean) || '—';
    }
    if (!s.fr || s.fr === '—') {
      s.fr = currentFrMap.get(symUpper) || currentFrMap.get(symClean) || '—';
    }
  });
  console.log(`[OBV_FINAL] Attached OBV signals to ${finalStockData.filter(s => s.obvSignal && s.obvSignal !== '—').length}/${finalStockData.length} stockData items.`);

  // --- Extract Exit / Target Screener from RECOMMENDATION tab ---
  let exitTargetScreener = [];
  try {
    const exitRows = exitTargetScreenerRes ? (exitTargetScreenerRes.data.values || []) : [];
    for (let i = 0; i < exitRows.length; i++) {
      const row = exitRows[i];
      if (!row || row.length < 2) continue;
      const rawId = (row[1] || '').toString().trim();
      if (!rawId) continue;
      const upperId = rawId.toUpperCase();
      if (
        upperId === 'ID' ||
        upperId === 'RANK' ||
        rawId.startsWith('──') ||
        upperId.includes('SECTOR RANKING') ||
        upperId.includes('TOP STOCKS') ||
        upperId.includes('TRAJECTORY QUALIFICATION') ||
        upperId.includes('PATTERNS') ||
        upperId.includes('CAUTIONS') ||
        upperId === 'WATCH NEXT' ||
        upperId === 'MARKET REGIME' ||
        upperId === 'DISCLAIMER' ||
        upperId === 'TRAJECTORY OVERALL NOTE'
      ) {
        continue;
      }

      exitTargetScreener.push({
        date: row[0] !== undefined && row[0] !== null ? row[0].toString().trim() : '',
        id: rawId,
        buyPrice: row[3] !== undefined && row[3] !== null ? row[3].toString().trim() : '',
        currentPrice: row[24] !== undefined && row[24] !== null ? row[24].toString().trim() : '',
        targetPrice: row[4] !== undefined && row[4] !== null ? row[4].toString().trim() : '',
        targetsHit: row[5] !== undefined && row[5] !== null ? row[5].toString().trim() : '',
        profit: row[17] !== undefined && row[17] !== null ? row[17].toString().trim() : '',
        status: row[16] !== undefined && row[16] !== null ? row[16].toString().trim() : '',
        reason: row[19] !== undefined && row[19] !== null ? row[19].toString().trim() : '',
        exitReason: row[13] !== undefined && row[13] !== null ? row[13].toString().trim() : '',
        exitDate: row[20] !== undefined && row[20] !== null ? row[20].toString().trim() : '',
        stoploss: row[21] !== undefined && row[21] !== null ? row[21].toString().trim() : ''
      });
    }
  } catch (err) {
    console.warn('Error processing exitTargetScreener:', err.message);
  }

  // --- Extract Weekly Recommendation Screener from WEEKLY-RECOMMENDATION tab ---
  let weeklyRecommendation = [];
  try {
    const weeklyRows = weeklyRecommendationRes ? (weeklyRecommendationRes.data.values || []) : [];
    for (let i = 0; i < weeklyRows.length; i++) {
      const row = weeklyRows[i];
      if (!row || row.length < 2) continue;
      const rawId = (row[1] || '').toString().trim();
      if (!rawId) continue;
      const upperId = rawId.toUpperCase();
      if (
        upperId === 'ID' ||
        upperId === 'SYMBOL' ||
        upperId === 'RANK' ||
        rawId.startsWith('──') ||
        upperId.includes('SECTOR') ||
        upperId.includes('DISCLAIMER')
      ) {
        continue;
      }

      weeklyRecommendation.push({
        date: row[0] !== undefined && row[0] !== null ? row[0].toString().trim() : '',
        id: rawId,
        entryDate: row[3] !== undefined && row[3] !== null ? row[3].toString().trim() : '',
        buyPrice: row[4] !== undefined && row[4] !== null ? row[4].toString().trim() : '',
        currentPrice: row[41] !== undefined && row[41] !== null ? row[41].toString().trim() : '',
        profit: row[27] !== undefined && row[27] !== null ? row[27].toString().trim() : '',
        status: row[42] !== undefined && row[42] !== null ? row[42].toString().trim() : '',
        reason: row[37] !== undefined && row[37] !== null ? row[37].toString().trim() : '',
        fundamentalView: row[38] !== undefined && row[38] !== null ? row[38].toString().trim() : '',
        exitReason: row[30] !== undefined && row[30] !== null ? row[30].toString().trim() : '',
        exitDate: row[28] !== undefined && row[28] !== null ? row[28].toString().trim() : ''
      });
    }
  } catch (err) {
    console.warn('Error processing weeklyRecommendation:', err.message);
  }

  return {
    marketMood,
    marketStrength: strengthData,
    marketPosition,
    stockData: finalStockData,
    topMovers,
    indexPerformance,
    nifty50Stocks,
    nearResistance,
    supportReversal,
    reactionZone,
    intradayBreakout,
    intradayBreakoutScanner,
    intradayReversal,
    intradayDev,
    intradayDevChanges,
    playbackSnapshots,
    goldenAlerts,
    dailyNews,
    niftyAnalysis,
    summaries,
    exitTargetScreener,
    weeklyRecommendation,
    lastUpdated: new Date().toISOString()
  };
}

export default async function handler(req, res) {
  const isForced = req.query.force === 'true';
  const isMarketNowOpen = isMarketOpen();
  const istTime = getLogTimeIST();

  if (!isMarketNowOpen && !isForced) {
      console.log(`[${istTime}] API requested after-hours. Resolving valid data structure for viewer...`);
  }

  try {
    const data = await fetchData();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    res.status(200).json(data);
  } catch (error) {
    console.error('Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch data', message: error.message });
  }
}
