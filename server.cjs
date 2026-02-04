const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return;
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) return;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    });
  } catch (error) {
    console.warn('Failed to load .env file:', error.message);
  }
}

loadEnvFile();

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

const app = express();
app.use(cors());

const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';
const SWING_SHEET_ID = '1GEhcqN8roNR1F3601XNEDjQZ1V0OfSUtMxUPE2rcdNs';

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

  if (!credentials) {
    const keyPath = path.join(__dirname, 'secerate_googlekey', 'key-partition-484615-n5-3411b9e54bd0.json');
    if (fs.existsSync(keyPath)) {
      try {
        credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
      } catch (e) {
        console.error('Failed to parse Google key file:', e.message);
      }
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
    throw new Error('No Google credentials found (env or file)');
  }
  return credentials;
}

function getFirebaseServiceAccount() {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!key) return null;

  try {
    let cleanKey = key.trim();
    if ((cleanKey.startsWith("'") && cleanKey.endsWith("'")) ||
        (cleanKey.startsWith('"') && cleanKey.endsWith('"'))) {
      cleanKey = cleanKey.slice(1, -1).trim();
    }

    let credentials = JSON.parse(cleanKey);
    if (typeof credentials === 'string') {
      credentials = JSON.parse(credentials);
    }

    if (credentials && credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
      credentials.private_key = credentials.private_key.trim();
      if (credentials.private_key.startsWith('"') && credentials.private_key.endsWith('"')) {
        credentials.private_key = credentials.private_key.slice(1, -1).replace(/\\n/g, '\n');
      }
    }

    return credentials;
  } catch (e) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', e.message);
    return null;
  }
}

if (!admin.apps.length) {
  const serviceAccount = getFirebaseServiceAccount();
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
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
    if (row[58] !== undefined && !obj['STATUS']) obj['STATUS'] = row[58];
    if (row[18] !== undefined && !obj['GROUP']) obj['GROUP'] = row[18];
    return obj;
  });
}

async function fetchData() {
  console.log('Fetching live data from Google Sheets...');
  const credentials = getCredentials();
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  
  const sheets = google.sheets({ version: 'v4', auth });
  
  console.log('Fetching all data from lasa-master...');
  const lasaMasterRes = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: 'lasa-master!A:FJ',
  });
  const lasaMasterData = rowsToObjects(lasaMasterRes.data.values);
  console.log(`Total rows fetched from lasa-master: ${lasaMasterData.length}`);
  
  const allDates = [...new Set(lasaMasterData.map(r => r['DATE']).filter(Boolean))];
  const sortedDates = allDates.sort((a, b) => new Date(b) - new Date(a));
  const latestDate = sortedDates[0];
  const latestLasaRows = lasaMasterData.filter(row => row['DATE'] === latestDate);
  console.log(`Latest date in lasa-master: ${latestDate} (${latestLasaRows.length} rows)`);

  const marketMood = {
    bullish: 0,
    bearish: 0,
    neutral: 0,
    date: formatDate(new Date(latestDate))
  };
  
  console.log('Fetching Swing DATA sheet...');
  const swingRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SWING_SHEET_ID,
    range: 'DATA',
  });
  const dataRows = rowsToObjects(swingRes.data.values);
  
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
    const symbol = row['STOCK_NAME'];
    if (!symbol) return;
    
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
      name: symbol,
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
  try {
    const currentRes = await sheets.spreadsheets.values.get({
      spreadsheetId: EOD_SHEET_ID,
      range: "'current'!A1:FJ",
    });
    const currentData = rowsToObjects(currentRes.data.values);
    
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
      marketMood.bullish = (bullCount / totalMoodStocks) * 100;
      marketMood.bearish = (bearCount / totalMoodStocks) * 100;
      marketMood.neutral = (neutCount / totalMoodStocks) * 100;
    }
    
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
    
    const indexStocksMap = {};
    Object.keys(indexColumns).forEach(idx => {
      indexStocksMap[idx] = { stocks: [], bullish: 0, bearish: 0 };
    });
    
    const latestLasaData = lasaMasterData.filter(row => row['DATE'] === latestDate);
    const stocksSource = currentData.length > 0 ? currentData : latestLasaData;

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
          const isBullish = dynamicStatus === 'BULLISH';
          const isBearish = dynamicStatus === 'BEARISH';
          
          indexStocksMap[indexName].stocks.push({
            id: stockId,
            stockName,
            price: closePrice,
            status: dynamicStatus,
            upperRange,
            lowerRange
          });
          
          if (isBullish) indexStocksMap[indexName].bullish++;
          if (isBearish) indexStocksMap[indexName].bearish++;
        }
      });
    });

    indexPerformance = Object.keys(indexStocksMap).map(indexName => {
      const data = indexStocksMap[indexName];
      const total = data.stocks.length;
      const strengthScore = total > 0 ? Math.round((data.bullish / total) * 100) : 50;
      return {
        name: indexName,
        stocksCount: total,
        bullishCount: data.bullish,
        bearishCount: data.bearish,
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
        id: row['ID'] || row['STOCK_NAME'],
        stockName: row['STOCK_NAME'],
        changePercent: parseFloat((row['CHANGE_PERCENT'] || '0').toString().replace('%', '').replace(/,/g, '')) || 0,
        closePrice: parseFloat((row['CLOSE_PRICE'] || '0').toString().replace(/,/g, '')) || 0
      }))
      .filter(s => !isNaN(s.changePercent) && !isNaN(s.closePrice));
    
    const sortedByChange = [...stocks].sort((a, b) => b.changePercent - a.changePercent);
    
    topMovers = {
      topGainers: sortedByChange.filter(s => s.changePercent > 0).slice(0, 10),
      topLosers: sortedByChange.filter(s => s.changePercent < 0).slice(-10).reverse()
    };
  } catch (err) {
    console.warn('Could not fetch top movers from current tab:', err.message);
  }
  
  return {
    marketMood,
    marketStrength: strengthData,
    marketPosition,
    stockData,
    topMovers,
    indexPerformance,
    lastUpdated: new Date().toISOString()
  };
}

let cachedData = null;
let lastFetchTime = 0;
const CACHE_DURATION = 1 * 60 * 1000;

app.get('/api/fetch-data', async (req, res) => {
  try {
    const now = Date.now();
    
    if (cachedData && (now - lastFetchTime) < CACHE_DURATION) {
      console.log('Returning cached data');
      return res.json(cachedData);
    }
    
    const data = await fetchData();
    cachedData = data;
    lastFetchTime = now;
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data', message: error.message });
  }
});

let cachedMultibagger = null;
let lastMultibaggerFetch = 0;

app.get('/api/multibagger', async (req, res) => {
  try {
    const now = Date.now();
    if (cachedMultibagger && (now - lastMultibaggerFetch) < CACHE_DURATION) {
      return res.json(cachedMultibagger);
    }

    let rows = [];
    const localExcelPath = path.join(__dirname, 'datapulling', 'LASA-EOD-DATA.xlsx');
    
    if (fs.existsSync(localExcelPath)) {
      console.log('Reading Multibagger data from local Excel file...');
      const workbook = XLSX.readFile(localExcelPath);
      const sheetName = workbook.SheetNames[2] || 'current';
      const sheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    } else {
      console.log('Local Excel file not found, falling back to Google Sheets...');
      const credentials = getCredentials();
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
      const sheets = google.sheets({ version: 'v4', auth });

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: EOD_SHEET_ID,
        range: "'current'!A:FJ",
      });
      rows = response.data.values;
    }

    if (!rows || rows.length < 2) {
      return res.json([]);
    }

    const idx = {
      sector: colToIdx('B'),
      id: colToIdx('C'),
      cmp: colToIdx('E'),
      dRsiDiff: colToIdx('J'),
      rsi: colToIdx('K'),
      wRsi: colToIdx('Q'),
      peRatio: colToIdx('EL'),
      algoB: colToIdx('EM'),
      dEma200: colToIdx('EO'),
      dEma200Status: colToIdx('EP'),
      fiveYHigh: colToIdx('ER'),
      dEma63: colToIdx('ES'),
      rsiAbove78: colToIdx('FI')
    };

    const mbData = rows.slice(1).filter(row => {
      const signal = (row[idx.rsiAbove78] || '').toString().toUpperCase();
      return signal === 'Y';
    });

    console.log(`Multibagger candidates found: ${mbData.length} (Expected ~214)`);
    
    const filtered = mbData
      .map(row => {
        const getNum = (val) => {
          if (val === undefined || val === null || val === '') return 0;
          return parseFloat(val.toString().replace(/,/g, '')) || 0;
        };

        return {
          sector: row[idx.sector] || 'N/A',
          id: row[idx.id] || 'N/A',
          stockName: row[idx.id] || 'N/A',
          cmp: getNum(row[idx.cmp]),
          rsi: getNum(row[idx.rsi]),
          dRsiDiff: getNum(row[idx.dRsiDiff]),
          wRsi: getNum(row[idx.wRsi]),
          dEma200: getNum(row[idx.dEma200]),
          dEma63: getNum(row[idx.dEma63]),
          peRatio: (row[idx.peRatio] || 'N/A').toString(),
          fiveYHigh: getNum(row[idx.fiveYHigh]),
          dEma200Status: (row[idx.dEma200Status] || 'N/A').toString(),
          algoB: (row[idx.algoB] || 'N/A').toString()
        };
      })
      .sort((a, b) => a.rsi - b.rsi);

    console.log(`Returning ${filtered.length} multibagger candidates sorted by RSI ascending`);
    cachedMultibagger = filtered;
    lastMultibaggerFetch = now;
    res.json(filtered);
  } catch (error) {
    console.error('Error fetching multibagger data:', error);
    res.status(500).json({ error: 'Failed to fetch multibagger data', message: error.message });
  }
});

app.all('/api/send-market-mood', async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!admin.apps.length) {
      return res.status(500).json({
        error: 'Firebase Admin not initialized',
        message: 'Set FIREBASE_SERVICE_ACCOUNT_KEY in your environment'
      });
    }

    const credentials = getCredentials();
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    const currentRes = await sheets.spreadsheets.values.get({
      spreadsheetId: EOD_SHEET_ID,
      range: "'current'!A1:FJ",
    });

    const rows = currentRes.data.values;
    if (!rows || rows.length < 2) {
      return res.status(500).json({ error: 'No data found in current sheet' });
    }

    const dataRows = rowsToObjects(rows);
    const moodStocks = dataRows.slice(0, 470).filter(row => {
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

    const total = moodStocks.length;
    if (total === 0) {
      return res.status(500).json({ error: 'No stocks found for mood calculation' });
    }

    const mood = {
      bullish: Math.round((bullCount / total) * 100),
      bearish: Math.round((bearCount / total) * 100),
      neutral: Math.round((neutCount / total) * 100),
    };

    let dominantMood = 'NEUTRAL';
    let moodPercent = mood.neutral;
    if (mood.bullish >= mood.bearish && mood.bullish >= mood.neutral) {
      dominantMood = 'BULLISH';
      moodPercent = mood.bullish;
    } else if (mood.bearish >= mood.bullish && mood.bearish >= mood.neutral) {
      dominantMood = 'BEARISH';
      moodPercent = mood.bearish;
    }

    const title = 'Market Mood Update';
    const body = `Today's market is ${moodPercent}% ${dominantMood}`;

    const tokensSnapshot = await admin.firestore().collection('fcm_tokens').get();
    const tokens = [];
    tokensSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.token) tokens.push(data.token);
    });

    let successCount = 0;
    let failedCount = 0;
    const invalidTokens = [];

    for (const token of tokens) {
      try {
        await admin.messaging().send({
          token,
          notification: { title, body },
          webpush: {
            notification: {
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              requireInteraction: true,
            },
            fcmOptions: {
              link: '/',
            },
          },
        });
        successCount++;
      } catch (error) {
        failedCount++;
        if (error.code === 'messaging/registration-token-not-registered' ||
            error.code === 'messaging/invalid-registration-token') {
          invalidTokens.push(token);
        }
      }
    }

    if (invalidTokens.length > 0) {
      const db = admin.firestore();
      for (const token of invalidTokens) {
        try {
          await db.collection('fcm_tokens').doc(token).delete();
        } catch (e) {
          console.error('Failed to delete invalid token:', e);
        }
      }
    }

    res.json({
      success: true,
      mood: {
        bullish: mood.bullish,
        bearish: mood.bearish,
        neutral: mood.neutral,
        dominant: dominantMood,
        percent: moodPercent
      },
      notification: {
        title,
        body,
        sentTo: tokens.length,
        successCount,
        failedCount,
        cleanedTokens: invalidTokens.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error sending market mood notification:', error);
    res.status(500).json({
      error: 'Failed to send market mood notification',
      message: error.message
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
