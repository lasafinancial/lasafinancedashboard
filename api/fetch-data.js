import { google } from 'googleapis';

const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';
const SWING_SHEET_ID = '1GEhcqN8roNR1F3601XNEDjQZ1V0OfSUtMxUPE2rcdNs';
const INDICES_SHEET_ID = '1EHB65PXFold-zCt-QkMzI_nfbZTuy4hEeS9G1naXhZQ';

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

      if ((cleanKey.startsWith("'") && cleanKey.endsWith("'")) ||
        (cleanKey.startsWith('"') && cleanKey.endsWith('"'))) {
        cleanKey = cleanKey.slice(1, -1).trim();
      }

      try {
        credentials = JSON.parse(cleanKey);
        if (typeof credentials === 'string') {
          credentials = JSON.parse(credentials);
        }
      } catch (e) {
        console.error('JSON Parse Error for GOOGLE_SERVICE_ACCOUNT_KEY:', e.message);
      }
    } catch (e) {
      console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY from env:', e.message);
    }
  }

  if (credentials && credentials.private_key) {
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    credentials.private_key = credentials.private_key.trim();
    if (credentials.private_key.startsWith('"') && credentials.private_key.endsWith('"')) {
      credentials.private_key = credentials.private_key.slice(1, -1).replace(/\\n/g, '\n');
    }
  }

  if (!credentials) {
    throw new Error('No Google credentials found (env)');
  }
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
    row.forEach((val, i) => {
      obj[i] = val !== undefined ? val : null; // Numeric index access
    });
    headers.forEach((header, i) => {
      if (header) {
        obj[header] = row[i] !== undefined ? row[i] : null;
      }
    });
    // Normalize commonly used fields with fallback indexes
    if (obj[colToIdx('BG')] !== undefined && !obj['STATUS']) obj['STATUS'] = obj[colToIdx('BG')];
    if (obj[colToIdx('S')] !== undefined && !obj['GROUP']) obj['GROUP'] = obj[colToIdx('S')];
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
  const credentials = getCredentials();

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  console.log('Fetching all data from lasa-master...');
  try {
    const lasaMasterRes = await sheets.spreadsheets.values.get({
      spreadsheetId: EOD_SHEET_ID,
      range: 'lasa-master!A:FJ',
    });
    var lasaMasterData = rowsToObjects(lasaMasterRes.data.values);
  } catch (err) {
    console.warn('Failed to fetch from lasa-master, using fallback or empty:', err.message);
    var lasaMasterData = [];
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
  });

  console.log('Fetching Swing DATA sheet...');
  try {
    const swingRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SWING_SHEET_ID,
      range: 'DATA',
    });
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
    if (group !== 'LARGECAP' && group !== 'MIDCAP' && group !== 'INDEX') {
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
      price: parseFloat(closeStr) || 0,
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
  let nifty50Stocks = [];
  let intradayBreakout = [];
  let niftyAnalysis = { summary: {}, scenarios: [], actionPlan: [] };
  try {
    const currentRes = await sheets.spreadsheets.values.get({
      spreadsheetId: EOD_SHEET_ID,
      range: "'current'!A1:FJ",
    });
    currentData = rowsToObjects(currentRes.data.values);

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
    const nearResistanceIdx = {
      ema200Status: colToIdx('EP'),
      id: colToIdx('C'),
      closePrice: colToIdx('E'),
      resistance: colToIdx('DI'),
      support: colToIdx('DH'),
      breakout: colToIdx('DU'),
      mlTargetPercent: colToIdx('EQ'),
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

      return {
        dEma200Status: (row['D-EMA-200-Status'] || row[nearResistanceIdx.ema200Status] || '').toString(),
        id: (row['ID'] || row[nearResistanceIdx.id] || '').toString(),
        closePrice: closePrice,
        resistance: getNum(row['RESISTANCE'] || row[nearResistanceIdx.resistance]),
        support: getNum(row['SUPPORT'] || row[nearResistanceIdx.support]),
        dBreakoutPrice: getNum(row['D_BREAKOUT_PRICE'] || row[nearResistanceIdx.breakout]),
        mlTargetPercent: getNum(row['ML_TARGET_PERCENT'] || row[nearResistanceIdx.mlTargetPercent]),
        algoB: getNum(row['ALGO_B'] || row[nearResistanceIdx.algoB]),
        algFgPercent: getNum(row[nearResistanceIdx.algFgPercent]),
        wProjection2: getNum(row['W_PROJECTION_2'] || row[nearResistanceIdx.wProjection2]),
        wProjection3: 0,
        algoFG: getNum(row['PROJ_FVG'] || row[nearResistanceIdx.algoFG]),
        algoM: getNum(row['ML_FUT_PRICE_20D'] || row[nearResistanceIdx.algoM]),
        algoW: getNum(row['WOLFE_D'] || row[nearResistanceIdx.algoW]),
        changePercent: getNum(row['CHANGE_PERCENT'] || row[colToIdx('BR')] || row[colToIdx('G')])
      };
    };

    nearResistance = currentData.filter(row => {
      const status = (row['STATUS'] || '').toString().toUpperCase();
      const group = (row['GROUP'] || '').toString().toUpperCase();
      return status === 'BULLISH' && (group === 'LARGECAP' || group === 'MIDCAP');
    }).map(mapStock).sort((a, b) => {
      if (a.dEma200Status === 'ABOVE' && b.dEma200Status !== 'ABOVE') return -1;
      if (a.dEma200Status !== 'ABOVE' && b.dEma200Status === 'ABOVE') return 1;
      return b.mlTargetPercent - a.mlTargetPercent;
    });

    // --- Support (Reversal) Screener Implementation ---
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
    // --- End Near Resistance ---

    // --- Start Reaction Zone ---
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
    // --- End Reaction Zone ---

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
      const indicesRes = await sheets.spreadsheets.values.get({
        spreadsheetId: INDICES_SHEET_ID,
        range: 'Sheet1!A:Z',
      });
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

      // Fetch DAILY_NEWS tab
      const newsRes = await sheets.spreadsheets.values.get({
        spreadsheetId: INDICES_SHEET_ID,
        range: 'DAILY_NEWS!A:Z',
      });
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

        for (let i = 1; i < newsRows.length; i++) {
          const row = newsRows[i];
          // Skip completely empty rows
          if (!row || row.length === 0 || !row[dateIdx]) continue;

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

      // Fetch DAILY_NIFTY_ANALYSIS tab
      try {
        const niftyRes = await sheets.spreadsheets.values.get({
          spreadsheetId: INDICES_SHEET_ID,
          range: 'DAILY_NIFTY_ANALYSIS!A1:Z500', // Expanded range for history
        });
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
            // Broader date match: 13-Mar-2026, 13/03/2026, 13-03-2026, or 2026-03-13
            const dateRegex = /^(\d{1,2}-[a-zA-Z]{3}-\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4}|\d{4}-\d{1,2}-\d{1,2})$/;
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

            const firstCell = (row[1] || '').toString().trim();
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

          // Reverse blocks so the latest (last in sheet) is at index 0
          blocks.reverse();

          // niftyAnalysis will now be an array, or we keep it as an object with a 'history' property
          niftyAnalysis = { history: blocks };
          console.log(`Parsed Nifty Analysis: ${blocks.length} date blocks found.`);
        }
      } catch (niftyErr) {
        console.warn('Could not fetch DAILY_NIFTY_ANALYSIS:', niftyErr.message);
      }
    } catch (indErr) {
      console.warn('Could not fetch INDICES sheet, falling back to column flags:', indErr.message);
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

    // Symbol mappings for known discrepancies
    const symbolAliasMap = {
      'TMPV': 'TMCV',
      'M&M': 'M&M'
    };

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

    // --- Start Intraday Breakout Screener ---
    try {
      const breakoutRes = await sheets.spreadsheets.values.get({
        spreadsheetId: EOD_SHEET_ID,
        range: 'intraday-breakout-scanner!A:Q',
      });
      const breakoutRows = breakoutRes.data.values;
      if (breakoutRows && breakoutRows.length > 1) {
        const breakoutData = rowsToObjects(breakoutRows);

        // Logic: Unique rows for last two trading days, de-duplicate Symbol + Time + Date
        const allBreakoutDates = [...new Set(breakoutData.map(r => r['Date']).filter(Boolean))];
        const sortedBreakoutDates = allBreakoutDates.sort((a, b) => new Date(b) - new Date(a));
        const lastTwoDates = sortedBreakoutDates.slice(0, 2);

        const seen = new Set();
        intradayBreakout = breakoutData
          .filter(row => row['Date'] && lastTwoDates.includes(row['Date']))
          .filter(row => {
            const key = `${row['Symbol']}_${row['Time']}_${row['Date']}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .map(row => {
            // Robust header lookup
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
            // Sort by Date and Time descending
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
    // --- End Intraday Breakout Screener ---

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
    dailyNews,
    niftyAnalysis,
    lastUpdated: new Date().toISOString()
  };
}

export default async function handler(req, res) {
  try {
    const data = await fetchData();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    res.status(200).json(data);
  } catch (error) {
    console.error('Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch data', message: error.message });
  }
}
