const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

function parseDateFlexible(dateStr) {
  if (!dateStr) return null;
  
  // Try standard ISO format first (YYYY-MM-DD)
  let date = new Date(dateStr + 'T00:00:00');
  if (!isNaN(date.getTime())) return date;
  
  // Try DD-MM-YYYY or DD/MM/YYYY format
  const parts = dateStr.split(/[-\/]/);
  if (parts.length === 3) {
    const [p1, p2, p3] = parts.map(p => parseInt(p, 10));
    
    // If first part > 12, it's likely DD-MM-YYYY
    if (p1 > 12) {
      date = new Date(p3, p2 - 1, p1);
      if (!isNaN(date.getTime())) return date;
    }
    
    // If third part > 31, it's likely MM-DD-YYYY or DD-MM-YYYY
    if (p3 > 31) {
      // Try DD-MM-YYYY
      date = new Date(p3, p2 - 1, p1);
      if (!isNaN(date.getTime())) return date;
    }
  }
  
  return null;
}

const app = express();
app.use(cors());

const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';
const SWING_SHEET_ID = '1GEhcqN8roNR1F3601XNEDjQZ1V0OfSUtMxUPE2rcdNs';

function getCredentials() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  }
  
  const keyPath = path.join(__dirname, 'secerate_googlekey', 'key-partition-484615-n5-52acc9edc675.json');
  if (fs.existsSync(keyPath)) {
    return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  }
  
  throw new Error('No Google credentials found');
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

function rowsToObjects(rows) {
  if (!rows || rows.length < 1) return [];
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      if (header) {
        obj[header] = row[i] !== undefined ? row[i] : null;
      }
    });
    // Specific mapping for Market Mood logic if headers are missing or unclear
    if (row[58] !== undefined && !obj['STATUS']) obj['STATUS'] = row[58]; // Column BG
    if (row[18] !== undefined && !obj['GROUP']) obj['GROUP'] = row[18];   // Column S
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
    
    // Parse and cache latestDate globally if needed, but for now we calculate locally
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
  
    console.log('Processing stock history (30 days)...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    console.log(`Thirty days ago cutoff: ${thirtyDaysAgo.toISOString()}`);
    
    const history = {};
    const resistanceSlopeMap = {};

    let parsedCount = 0;
    let skippedCount = 0;
    let invalidDateCount = 0;

    lasaMasterData.forEach(row => {
      const dateStr = row['DATE'];
      if (!dateStr) return;
      
      const rowDate = parseDateFlexible(dateStr);
      if (!rowDate) {
        invalidDateCount++;
        return;
      }
      
      if (rowDate < thirtyDaysAgo) {
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
    
    history[symbol].push({
      dateObj: rowDate,
      dateDisplay: formatDate(rowDate),
      price: parseFloat(closeStr) || 0,
      rsi: parseFloat(row['RSI']) || 0,
      trend: row['DAILY_TREND'] || '',
      support: parseFloat(supportStr) || 0,
      resistance: parseFloat(resistanceStr) || 0,
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
        date: h.dateDisplay
      }))
    };
  }).filter(Boolean);


  console.log('Fetching Top Movers and Index Performance...');
  let topMovers = { topGainers: [], topLosers: [] };
  let indexPerformance = [];
  try {
      const currentRes = await sheets.spreadsheets.values.get({
        spreadsheetId: EOD_SHEET_ID,
        range: "'current'!A1:FJ",
      });
      const currentData = rowsToObjects(currentRes.data.values);
      
      // Calculate Market Mood based on new logic: top 470 rows, Large/Mid cap, Status BG (column 59/index 58)
      const moodStocks = currentData.slice(0, 470).filter(row => {
        const group = (row['GROUP'] || '').toString().toUpperCase();
        return group === 'LARGECAP' || group === 'MIDCAP';
      });

      let bullCount = 0, bearCount = 0, neutCount = 0;
      moodStocks.forEach(row => {
        // Use column BG (index 58) if 'STATUS' header not found or empty
        let statusValue = row['STATUS'];
        if (statusValue === null || statusValue === undefined) {
          // Fallback to direct index access if rowsToObjects didn't map it correctly
          // We need the raw rows for this, but let's assume 'STATUS' is the header if it exists.
          // If not, we'll try to find it in the object keys.
        }
        
        const status = (statusValue || '').toString().toUpperCase();
        if (status === 'BULLISH') bullCount++;
        else if (status === 'BEARISH') bearCount++;
        else if (status === 'NEUTRAL' || status === '') neutCount++;
        else neutCount++; // Default to neutral for any other value
      });

      const totalMoodStocks = moodStocks.length;
      if (totalMoodStocks > 0) {
        marketMood.bullish = (bullCount / totalMoodStocks) * 100;
        marketMood.bearish = (bearCount / totalMoodStocks) * 100;
        marketMood.neutral = (neutCount / totalMoodStocks) * 100;
      }

      console.log(`Market Mood calculated from ${totalMoodStocks} Large/Mid Cap stocks: ${marketMood.bullish.toFixed(1)}% Bullish, ${marketMood.bearish.toFixed(1)}% Bearish, ${marketMood.neutral.toFixed(1)}% Neutral`);

    
      console.log('Current tab sample headers:', Object.keys(currentData[0] || {}).slice(0, 20));
      
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
      
      // Use currentData for live status, but latestLasaData for index mapping if needed
      const stocksSource = currentData.length > 0 ? currentData : latestLasaData;

      stocksSource.forEach(row => {
        const stockName = row['STOCK_NAME'];
        const status = (row['STATUS'] || '').toString().toUpperCase();
        const closePrice = parseFloat((row['CLOSE_PRICE'] || '0').toString().replace(/,/g, '')) || 0;
        const stockId = row['ID'] || stockName;
        const upperRange = parseFloat((row['UPPER_RANGE'] || '0').toString().replace(/,/g, '')) || 0;
        const lowerRange = parseFloat((row['LOWER_RANGE'] || '0').toString().replace(/,/g, '')) || 0;
        
        if (!stockName) return;
        
        Object.keys(indexColumns).forEach(indexName => {
          const colName = indexColumns[indexName];
          const val = row[colName];
          if (val && val.toString().trim() !== '' && val.toString().toUpperCase() !== 'FALSE') {
            const isBullish = status === 'BULLISH';
            const isBearish = status === 'BEARISH';
            
            indexStocksMap[indexName].stocks.push({
              id: stockId,
              stockName,
              price: closePrice,
              status: status || 'NEUTRAL',
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
          stocks: data.stocks // Include stocks for the popup
        };
      }).filter(idx => idx.stocksCount > 0).sort((a, b) => b.strengthScore - a.strengthScore);

    
    console.log(`Index Performance: ${indexPerformance.length} indices processed`);
    
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
    
    console.log(`Top Movers: Filtered to ${stocks.length} Large Cap + Mid Cap stocks`);
    
    const sortedByChange = [...stocks].sort((a, b) => b.changePercent - a.changePercent);
    
      topMovers = {
        topGainers: sortedByChange.filter(s => s.changePercent > 0).slice(0, 10),
        topLosers: sortedByChange.filter(s => s.changePercent < 0).slice(-10).reverse()
      };
      console.log(`Top Movers: ${topMovers.topGainers.length} gainers, ${topMovers.topLosers.length} losers.`);
    } catch (err) {
    console.warn('Could not fetch top movers from current tab:', err.message);
  }
  
  console.log('Data fetch complete!');
  
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
const CACHE_DURATION = 5 * 60 * 1000;

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

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  GET /api/fetch-data - Fetch live Google Sheets data');
});
