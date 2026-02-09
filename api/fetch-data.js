import { google } from 'googleapis';

const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';
const SWING_SHEET_ID = '1GEhcqN8roNR1F3601XNEDjQZ1V0OfSUtMxUPE2rcdNs';

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
  let credentials;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (key) {
    try {
      let cleanKey = key.trim();
      if ((cleanKey.startsWith("'") && cleanKey.endsWith("'")) || (cleanKey.startsWith('"') && cleanKey.endsWith('"'))) {
        cleanKey = cleanKey.slice(1, -1).trim();
      }
      try {
        credentials = JSON.parse(cleanKey);
        if (typeof credentials === 'string') credentials = JSON.parse(credentials);
      } catch (e) { console.error('JSON Parse Error:', e.message); }
    } catch (e) { console.error('Env Parse Error:', e.message); }
  }
  if (credentials && credentials.private_key) {
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n').trim();
    if (credentials.private_key.startsWith('"') && credentials.private_key.endsWith('"')) {
      credentials.private_key = credentials.private_key.slice(1, -1).replace(/\\n/g, '\n');
    }
  }
  if (!credentials) throw new Error('No Google credentials found');
  return credentials;
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
  let date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return null;
  const day = date.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day}${getOrdinalSuffix(day)} ${months[date.getMonth()]}`;
}

function parseSwingDate(dateStr) {
  if (!dateStr) return null;
  const monthMap = { 'jan': 0, 'january': 0, 'feb': 1, 'february': 1, 'mar': 2, 'march': 2, 'apr': 3, 'april': 3, 'may': 4, 'jun': 5, 'june': 5, 'jul': 6, 'july': 6, 'aug': 7, 'august': 7, 'sep': 8, 'september': 8, 'oct': 9, 'october': 9, 'nov': 10, 'november': 10, 'dec': 11, 'december': 11 };
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
  if (pricePosition > 66.66) return "BULLISH";
  if (pricePosition < 33.33) return "BEARISH";
  return "NEUTRAL";
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
    row.forEach((val, i) => { obj[i] = val !== undefined ? val : null; });
    headers.forEach((header, i) => { if (header) obj[header] = row[i] !== undefined ? row[i] : null; });
    if (obj[colToIdx('BG')] !== undefined && !obj['STATUS']) obj['STATUS'] = obj[colToIdx('BG')];
    if (obj[colToIdx('S')] !== undefined && !obj['GROUP']) obj['GROUP'] = obj[colToIdx('S')];
    return obj;
  });
}

async function fetchData() {
  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] });
  const sheets = google.sheets({ version: 'v4', auth });

  let topMovers = { topGainers: [], topLosers: [] };
  let indexPerformance = [];
  let nearResistance = [];
  let supportReversal = [];

  try {
    const [lasaMasterRes, swingRes, currentRes] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId: EOD_SHEET_ID, range: 'lasa-master!A:FJ' }),
      sheets.spreadsheets.values.get({ spreadsheetId: SWING_SHEET_ID, range: 'DATA' }),
      sheets.spreadsheets.values.get({ spreadsheetId: EOD_SHEET_ID, range: "'current'!A1:FJ" })
    ]);

    const lasaMasterRows = lasaMasterRes.data.values || [];
    const lasaMasterData = rowsToObjects(lasaMasterRows);

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
        const cp = gn(row['CLOSE_PRICE'] || row[4]); // E
        const res = gn(row['RESISTANCE'] || row[115]); // DI
        const sup = gn(row['SUPPORT'] || row[114]); // DH
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
    });

    const dataRows = rowsToObjects(swingRes.data.values || []);

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
    })).filter(r => r.dateObj && !isNaN(r.dateObj.getTime())).sort((a, b) => a.dateObj - b.dateObj).slice(-130).map(r => ({
      date: formatSwingDate(r.dateStr), rsi: r.rsi, ml_higher: r.ml_higher, ml_lower: r.ml_lower, fg_above: r.fg_above, fg_below: r.fg_below, fg_net: r.fg_net, nifty50_close: r.nifty50_close, total_score: r.total_score, ml_threshold: r.ml_threshold, momentum_oscillator: r.momentum_oscillator
    }));

    const latestSwingData = dataRows[dataRows.length - 1] || {};
    const marketPosition = {
      model: { bullish: parseFloat(latestSwingData['ML_ABOVE']) || 0, bearish: parseFloat(latestSwingData['ML_BELOW']) || 0, neutral: Math.max(0, 100 - ((parseFloat(latestSwingData['ML_ABOVE']) || 0) + (parseFloat(latestSwingData['ML_BELOW']) || 0))) },
      balance: { above: parseFloat(latestSwingData['FG_ABOVE']) || 0, below: parseFloat(latestSwingData['FG_BELOW']) || 0 },
      momentum: { bullish: 100 - (parseFloat(latestSwingData['NIFTY100_DAILY_RSI_ABOVE50']) || 0), bearish: parseFloat(latestSwingData['NIFTY100_DAILY_RSI_ABOVE50']) || 0 },
      sr: { atSupport: parseFloat(latestSwingData['TOTAL_SUPPORT']) || 0, atResistance: parseFloat(latestSwingData['TOTAL_RESITANCE']) || parseFloat(latestSwingData['TOTAL_RESISTANCE']) || 0, neutral: 0 },
      reversal: { up: parseFloat(latestSwingData['REVERSAL_UP']) || 0, down: parseFloat(latestSwingData['REVERSAL_DOWN']) || 0, neutral: Math.max(0, 100 - ((parseFloat(latestSwingData['REVERSAL_UP']) || 0) + (parseFloat(latestSwingData['REVERSAL_DOWN']) || 0))) },
      lastUpdate: new Date().toLocaleTimeString()
    };

    const historyCutoff = new Date();
    historyCutoff.setDate(historyCutoff.getDate() - 180);
    historyCutoff.setHours(0, 0, 0, 0);

    const history = {};
    const resistanceSlopeMap = {};
    const fullNameMap = {};

    lasaMasterData.forEach(row => {
      const dateStr = row['DATE'];
      if (!dateStr) return;
      const group = (row['GROUP'] || '').toString().toUpperCase();
      if (group !== 'LARGECAP' && group !== 'MIDCAP' && group !== 'INDEX') return;
      const rowDate = parseDateFlexible(dateStr);
      if (!rowDate || rowDate < historyCutoff) return;
      const symbol = row['ID'] || row['STOCK_NAME'];
      if (!symbol) return;
      if (!fullNameMap[symbol]) fullNameMap[symbol] = row['STOCK_NAME'] || symbol;
      if (dateStr === latestDate) resistanceSlopeMap[symbol] = (row['RESISTANCE_SLOPE_DOWNWARD'] || '').toString().toLowerCase() === 'true';
      if (!history[symbol]) history[symbol] = [];
      const gn = (v) => (v === undefined || v === null || v === '') ? 0 : parseFloat(v.toString().replace(/,/g, '')) || 0;
      history[symbol].push({
        dateObj: rowDate, dateDisplay: formatDate(rowDate), price: gn(row['CLOSE_PRICE'] || row[4]), rsi: gn(row['RSI'] || row[16]), trend: row['DAILY_TREND'] || row[11] || '', support: gn(row['SUPPORT'] || row[114]), resistance: gn(row['RESISTANCE'] || row[115]), mlFutPrice20d: gn(row['ML_FUT_PRICE_20D'] || row[134]), wolfeD: gn(row['WOLFE_D'] || row[135]), projFvg: gn(row['PROJ_FVG'] || row[137]), sector: row['SECTOR'] || row[1] || ''
      });
    });

    const stockData = Object.keys(history).map(symbol => {
      const stockHistory = history[symbol].sort((a, b) => a.dateObj - b.dateObj);
      if (stockHistory.length === 0) return null;
      const latest = stockHistory[stockHistory.length - 1];
      return { symbol, name: fullNameMap[symbol] || symbol, sector: latest.sector, price: latest.price, rsi: latest.rsi, trend: latest.trend, resistanceSlopeDownward: resistanceSlopeMap[symbol] || false, history: stockHistory.map(h => ({ price: h.price, rsi: h.rsi, trend: h.trend, support: h.support, resistance: h.resistance, mlFutPrice20d: h.mlFutPrice20d, wolfeD: h.wolfeD, projFvg: h.projFvg, date: h.dateDisplay })) };
    }).filter(Boolean);

    const currentData = rowsToObjects(currentRes.data.values || []);

    if (currentData.length > 0) {
      const moodStocks = currentData.slice(0, 470).filter(row => { const g = (row['GROUP'] || '').toString().toUpperCase(); return g === 'LARGECAP' || g === 'MIDCAP'; });
      let bullCount = 0, bearCount = 0, neutCount = 0;
      moodStocks.forEach(row => {
        const cp = parseFloat((row['CLOSE_PRICE'] || row[4] || '0').toString().replace(/,/g, '')) || 0;
        const res = parseFloat((row['RESISTANCE'] || row[115] || '0').toString().replace(/,/g, '')) || 0;
        const sup = parseFloat((row['SUPPORT'] || row[114] || '0').toString().replace(/,/g, '')) || 0;
        const st = getDynamicStatus(cp, sup, res);
        if (st === 'BULLISH') bullCount++; else if (st === 'BEARISH') bearCount++; else neutCount++;
      });

      const sentiment = {
        bullish: moodStocks.length > 0 ? (bullCount / moodStocks.length) * 100 : 0,
        bearish: moodStocks.length > 0 ? (bearCount / moodStocks.length) * 100 : 0,
        neutral: moodStocks.length > 0 ? (neutCount / moodStocks.length) * 100 : 0
      };

      marketMood.bullish = sentiment.bullish;
      marketMood.bearish = sentiment.bearish;
      marketMood.neutral = sentiment.neutral;

      // Add current live point to trend
      const liveDate = formatDate(new Date());
      marketMood.trend.push({
        date: `Live (${liveDate})`,
        ...sentiment
      });

      // Keep only last 6 points max
      if (marketMood.trend.length > 6) {
        marketMood.trend.shift();
      }
    }

    // --- Near Resistance Screener Implementation ---
    const nrIdx = { ep: colToIdx('EP'), c: colToIdx('C'), e: colToIdx('E'), di: colToIdx('DI'), dh: colToIdx('DH'), du: colToIdx('DU'), eq: colToIdx('EQ'), dj: colToIdx('DJ'), ao: colToIdx('AO'), ar: colToIdx('AR') };

    const mapStock = (row) => {
      const gn = (v) => (v === undefined || v === null || v === '' || v.toString().includes('#')) ? 0 : parseFloat(v.toString().replace(/,/g, '')) || 0;
      return {
        dEma200Status: (row['D-EMA-200-Status'] || row[nrIdx.ep] || '').toString(),
        id: (row['ID'] || row[nrIdx.c] || '').toString(),
        closePrice: gn(row['CLOSE_PRICE'] || row[nrIdx.e]),
        resistance: gn(row['RESISTANCE'] || row[nrIdx.di]),
        support: gn(row['SUPPORT'] || row[nrIdx.dh]),
        dBreakoutPrice: gn(row['D_BREAKOUT_PRICE'] || row[nrIdx.du]),
        mlTargetPercent: gn(row['ML_TARGET_PERCENT'] || row[nrIdx.eq]),
        algoB: gn(row['ALGO_B'] || row[colToIdx('EM')]),
        algFgPercent: gn(row['ALG_FG_PERCENT'] || row[colToIdx('FI')]),
        wProjection2: gn(row['W_PROJECTION_2'] || row[colToIdx('FJ')]),
        wProjection3: 0,
        algoFG: gn(row['PROJ_FVG'] || row[nrIdx.dj]),
        algoM: gn(row['ML_FUT_PRICE_20D'] || row[nrIdx.ao]),
        algoW: gn(row['WOLFE_D'] || row[nrIdx.ar])
      };
    };

    nearResistance = currentData.filter(row => {
      const st = (row['STATUS'] || row[colToIdx('BG')] || '').toString().toUpperCase();
      const grp = (row['GROUP'] || row[colToIdx('S')] || '').toString().toUpperCase();
      return st === 'BULLISH' && (grp === 'LARGECAP' || grp === 'MIDCAP');
    }).map(mapStock);

    // --- Support (Reversal) Screener Implementation ---
    // Query: Price > Support AND Breakout < Support
    // Sort: EMA200Status (ABOVE first), then mlTargetPercent Decreasing
    supportReversal = currentData.filter(row => {
      const gn = (v) => (v === undefined || v === null || v === '' || v.toString().includes('#')) ? 0 : parseFloat(v.toString().replace(/,/g, '')) || 0;
      const cp = gn(row['CLOSE_PRICE'] || row[nrIdx.e]);
      const sup = gn(row['SUPPORT'] || row[nrIdx.dh]);
      const brk = gn(row['D_BREAKOUT_PRICE'] || row[nrIdx.du]);
      return cp > sup && brk < sup;
    }).map(mapStock).sort((a, b) => {
      if (a.dEma200Status === 'ABOVE' && b.dEma200Status !== 'ABOVE') return -1;
      if (a.dEma200Status !== 'ABOVE' && b.dEma200Status === 'ABOVE') return 1;
      return b.mlTargetPercent - a.mlTargetPercent;
    });

    const idxCols = { 'NIFTY 50': 'NIFTY50', 'NIFTY BANK': 'NIFTYBANK', 'NIFTY IT': 'NIFTYIT', 'NIFTY AUTO': 'NIFTYAUTO', 'NIFTY PHARMA': 'NIFTYPHARMA', 'NIFTY METAL': 'NIFTYMETAL', 'NIFTY FMCG': 'NIFTYFMCG', 'NIFTY INFRA': 'NIFTYINFRA', 'NIFTY PSU BANK': 'NIFTYPSUBANK', 'NIFTY PVT BANK': 'NIFTYPVTBANK', 'NIFTY CPSE': 'NIFTYCPSE', 'NIFTY 500': 'NIFTY500' };
    const idxMap = {}; Object.keys(idxCols).forEach(k => { idxMap[k] = { stocks: [], bullish: 0, bearish: 0 }; });
    currentData.forEach(row => {
      const name = row['STOCK_NAME'] || row[colToIdx('D')];
      const cp = parseFloat((row['CLOSE_PRICE'] || row[colToIdx('E')] || '0').toString().replace(/,/g, '')) || 0;
      const res = parseFloat((row['RESISTANCE'] || row[colToIdx('DI')] || '0').toString().replace(/,/g, '')) || 0;
      const sup = parseFloat((row['SUPPORT'] || row[colToIdx('DH')] || '0').toString().replace(/,/g, '')) || 0;
      const st = getDynamicStatus(cp, sup, res);
      if (!name) return;
      Object.keys(idxCols).forEach(k => {
        if (row[idxCols[k]] && row[idxCols[k]].toString().trim() !== '' && row[idxCols[k]].toString().toUpperCase() !== 'FALSE') {
          idxMap[k].stocks.push({ id: row['ID'] || row[colToIdx('C')] || name, stockName: name, price: cp, status: st });
          if (st === 'BULLISH') idxMap[k].bullish++; else if (st === 'BEARISH') idxMap[k].bearish++;
        }
      });
    });
    indexPerformance = Object.keys(idxMap).map(k => { const d = idxMap[k]; return { name: k, stocksCount: d.stocks.length, bullishCount: d.bullish, bearishCount: d.bearish, strengthScore: d.stocks.length > 0 ? Math.round((d.bullish / d.stocks.length) * 100) : 50, stocks: d.stocks }; }).filter(i => i.stocksCount > 0).sort((a, b) => b.strengthScore - a.strengthScore);

    const ms = currentData.filter(row => { const g = (row['GROUP'] || row[colToIdx('S')] || '').toString().toUpperCase(); return (g === 'LARGECAP' || g === 'MIDCAP') && (row['STOCK_NAME'] || row[colToIdx('D')]) && row['CHANGE_PERCENT'] !== undefined; }).map(row => ({
      id: row['ID'] || row[colToIdx('C')] || row['STOCK_NAME'] || row[colToIdx('D')], stockName: row['STOCK_NAME'] || row[colToIdx('D')], changePercent: parseFloat((row['CHANGE_PERCENT'] || row[colToIdx('G')] || '0').toString().replace('%', '').replace(/,/g, '')) || 0, closePrice: parseFloat((row['CLOSE_PRICE'] || row[colToIdx('E')] || '0').toString().replace(/,/g, '')) || 0
    }));
    const sorted = [...ms].sort((a, b) => b.changePercent - a.changePercent);
    topMovers = { topGainers: sorted.filter(s => s.changePercent > 0).slice(0, 10), topLosers: sorted.filter(s => s.changePercent < 0).slice(-10).reverse() };
  } catch (err) { console.warn('Current fetch failed:', err.message); }

  return { marketMood, marketStrength: strengthData, marketPosition, stockData, topMovers, indexPerformance, nearResistance, supportReversal, lastUpdated: new Date().toISOString() };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const data = await fetchData();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    res.status(200).json(data);
  } catch (error) {
    console.error('Fetch Error:', error);
    res.status(500).json({ error: 'Failed' });
  }
}
