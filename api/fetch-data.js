const { google } = require('googleapis');

const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';
const SWING_SHEET_ID = '1GEhcqN8roNR1F3601XNEDjQZ1V0OfSUtMxUPE2rcdNs';

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
  } else if (typeof dateInput === 'number') {
    const utc_days = Math.floor(dateInput - 25569);
    date = new Date(utc_days * 86400 * 1000);
  } else if (typeof dateInput === 'string') {
    date = new Date(dateInput);
  } else {
    return null;
  }
  if (isNaN(date.getTime())) return null;
  const day = date.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  return `${day}${getOrdinalSuffix(day)} ${month}`;
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

function formatSwingDate(dateStr) {
  const date = parseSwingDate(dateStr);
  if (!date) return dateStr;
  const day = date.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day}${getOrdinalSuffix(day)} ${months[date.getMonth()]}`;
}

function formatSheetDate(sheetName) {
  const parts = sheetName.split('-');
  if (parts.length !== 3) return sheetName;
  const day = parseInt(parts[0]);
  const months = { 'JAN': 'Jan', 'FEB': 'Feb', 'MAR': 'Mar', 'APR': 'Apr', 'MAY': 'May', 'JUN': 'Jun', 'JUL': 'Jul', 'AUG': 'Aug', 'SEP': 'Sep', 'OCT': 'Oct', 'NOV': 'Nov', 'DEC': 'Dec' };
  const month = months[parts[1].toUpperCase()] || 'Jan';
  return `${day}${getOrdinalSuffix(day)} ${month}`;
}

function parseSheetDate(name) {
  const p = name.split('-');
  if (p.length !== 3) return new Date(0);
  const months = { 'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5, 'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11 };
  let year = parseInt(p[2]);
  if (year < 100) year += 2000;
  return new Date(year, months[p[1].toUpperCase()], parseInt(p[0]));
}

function rowsToObjects(rows) {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i] !== undefined ? row[i] : null;
    });
    return obj;
  });
}

async function fetchData() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  
  const sheets = google.sheets({ version: 'v4', auth });
  
  const eodMeta = await sheets.spreadsheets.get({ spreadsheetId: EOD_SHEET_ID });
  const allSheets = eodMeta.data.sheets.map(s => s.properties.title);
  
  const dateSheets = allSheets.filter(name => /^\d+-[A-Z]+-\d+$/i.test(name));
  const latestSheetName = dateSheets.sort((a, b) => parseSheetDate(b) - parseSheetDate(a))[0];
  
  const moodRes = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: `'${latestSheetName}'`,
  });
  const moodData = rowsToObjects(moodRes.data.values);
  
  let bullish = 0, bearish = 0, neutral = 0;
  moodData.forEach(row => {
    const close = parseFloat(row['CLOSE_PRICE']);
    const res = parseFloat(row['UPPER_RANGE']);
    const sup = parseFloat(row['LOWER_RANGE']);
    if (isNaN(close) || isNaN(res) || isNaN(sup)) { neutral++; return; }
    if ((res - close) / res <= 0.01) bullish++;
    else if ((close - sup) / sup <= 0.01) bearish++;
    else neutral++;
  });
  
  const marketMood = {
    bullish: (bullish / moodData.length) * 100,
    bearish: (bearish / moodData.length) * 100,
    neutral: (neutral / moodData.length) * 100,
    date: formatSheetDate(latestSheetName)
  };
  
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
    fg_net: parseFloat(row['FG_NET']) || 0
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
      fg_net: r.fg_net
    }));
  
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const historySheets = allSheets.filter(name => /^\d+-[A-Z]+-\d+$/i.test(name))
    .filter(name => parseSheetDate(name) >= sixMonthsAgo)
    .sort((a, b) => parseSheetDate(b) - parseSheetDate(a));
  
  const history = {};
  const BATCH_SIZE = 3;
  
  for (let i = 0; i < historySheets.length; i += BATCH_SIZE) {
    const batch = historySheets.slice(i, i + BATCH_SIZE);
    
    const batchResults = await Promise.all(batch.map(async (sheetName) => {
      try {
        const sheetRes = await sheets.spreadsheets.values.get({
          spreadsheetId: EOD_SHEET_ID,
          range: `'${sheetName}'`,
        });
        return { sheetName, rows: rowsToObjects(sheetRes.data.values) };
      } catch (err) {
        console.error(`Error fetching ${sheetName}: ${err.message}`);
        return { sheetName, rows: [] };
      }
    }));
    
    batchResults.forEach(({ sheetName, rows }) => {
      const sheetDate = parseSheetDate(sheetName);
      rows.forEach(row => {
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
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  const stockData = Object.keys(history).map(symbol => {
    const stockHistory = history[symbol]
      .filter(h => h.dateObj && !isNaN(h.dateObj.getTime()))
      .sort((a, b) => a.dateObj - b.dateObj);
    
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
  
  return {
    marketMood,
    marketStrength: strengthData,
    stockData,
    lastUpdated: new Date().toISOString()
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const data = await fetchData();
    
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data', message: error.message });
  }
};
