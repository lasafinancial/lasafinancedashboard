const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');

const app = express();
app.use(cors());

const KEY_FILE = path.join(__dirname, '..', 'key-partition-484615-n5-67743fa5e288.json');
const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';
const SWING_SHEET_ID = '1GEhcqN8roNR1F3601XNEDjQZ1V0OfSUtMxUPE2rcdNs';

async function getAuth() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });
  return auth;
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

app.get('/api/market-position', async (req, res) => {
  try {
    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: EOD_SHEET_ID,
      range: "'current'!A1:DZ"
    });
    
    const data = rowsToObjects(response.data.values);
    
    let mlBuy = 0, mlSell = 0, mlIgnore = 0;
    let balanceAbove = 0, balanceBelow = 0;
    let rsiAbove = 0, rsiBelow = 0;
    let atSupport = 0, atResistance = 0, srNeutral = 0;
    let revUp = 0, revDown = 0, revNeutral = 0;
    let validCount = 0;
    
    data.forEach(row => {
      const closePrice = parseFloat((row['CLOSE_PRICE'] || '0').toString().replace(/,/g, ''));
      if (!closePrice || closePrice === 0) return;
      validCount++;
      
      const mlRecom = (row['ML-RECOM'] || '').toString().toUpperCase();
      if (mlRecom === 'BUY') mlBuy++;
      else if (mlRecom === 'SELL') mlSell++;
      else mlIgnore++;
      
      const avgPrice20d = parseFloat((row['AVG_PRICE_20D'] || '0').toString().replace(/,/g, ''));
      if (avgPrice20d > 0) {
        if (closePrice > avgPrice20d) balanceAbove++;
        else balanceBelow++;
      }
      
      const rsi = parseFloat(row['RSI'] || '50');
      if (rsi > 50) rsiAbove++;
      else rsiBelow++;
      
      const support = parseFloat((row['SUPPORT'] || '0').toString().replace(/,/g, ''));
      const resistance = parseFloat((row['RESISTANCE'] || '0').toString().replace(/,/g, ''));
      if (support > 0 && resistance > 0 && resistance > support) {
        const range = resistance - support;
        const distFromSupport = closePrice - support;
        const distFromResistance = resistance - closePrice;
        const supportZone = range * 0.2;
        const resistanceZone = range * 0.2;
        
        if (distFromSupport <= supportZone) atSupport++;
        else if (distFromResistance <= resistanceZone) atResistance++;
        else srNeutral++;
      } else {
        srNeutral++;
      }
      
      const heikenSignal = (row['HIEKEN_LAST_SIGNAL'] || '').toString().toLowerCase();
      
      if (heikenSignal.includes('reversal_up') || heikenSignal.includes('buy') || heikenSignal.includes('long')) {
        revUp++;
      } else if (heikenSignal.includes('reversal_down') || heikenSignal.includes('sell') || heikenSignal.includes('short')) {
        revDown++;
      } else {
        revNeutral++;
      }
    });
    
    const total = validCount || 1;
    
    const result = {
      model: {
        bullish: Math.round((mlBuy / total) * 100),
        bearish: Math.round((mlSell / total) * 100),
        neutral: Math.round((mlIgnore / total) * 100)
      },
      balance: {
        above: Math.round((balanceAbove / total) * 100),
        below: Math.round((balanceBelow / total) * 100)
      },
      momentum: {
        bullish: Math.round((rsiAbove / total) * 100),
        bearish: Math.round((rsiBelow / total) * 100)
      },
      sr: {
        atSupport: Math.round((atSupport / total) * 100),
        atResistance: Math.round((atResistance / total) * 100),
        neutral: Math.round((srNeutral / total) * 100)
      },
      reversal: {
        up: Math.round((revUp / total) * 100),
        down: Math.round((revDown / total) * 100),
        neutral: Math.round((revNeutral / total) * 100)
      },
      lastUpdate: new Date().toLocaleTimeString(),
      totalStocks: validCount
    };
    
    console.log('Market Position Data:', JSON.stringify(result, null, 2));
    res.json(result);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sheets/:range', async (req, res) => {
  try {
    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const range = decodeURIComponent(req.params.range);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: EOD_SHEET_ID,
      range: range
    });
    
    res.json({ values: response.data.values || [] });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/swing-data', async (req, res) => {
  try {
    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SWING_SHEET_ID,
      range: "'data'!A:Z"
    });
    
    const rows = response.data.values || [];
    if (rows.length < 2) {
      return res.json({ error: 'No data found' });
    }
    
    const headers = rows[0];
    const latestRow = rows[rows.length - 1];
    
    const getVal = (colName) => {
      const idx = headers.indexOf(colName);
      if (idx === -1) return 0;
      return parseFloat(latestRow[idx]) || 0;
    };
    
    const mlUp = getVal('ML_ABOVE');
    const mlDown = getVal('ML_BELOW');
    const mlTotal = mlUp + mlDown || 1;
    
    const fgAbove = getVal('FG_ABOVE');
    const fgBelow = getVal('FG_BELOW');
    const fgTotal = fgAbove + fgBelow || 1;
    
    const rsiAbove = getVal('NIFTY100_DAILY_RSI_ABOVE50');
    const rsiTotal = 100;
    const rsiBelow = rsiTotal - rsiAbove;
    
    const support = getVal('TOTAL_SUPPORT');
    const resistance = getVal('TOTAL_RESITANCE');
    const srTotal = support + resistance || 1;
    
    const revUp = getVal('REVERSAL_UP');
    const revDown = getVal('REVERSAL_DOWN');
    const revTotal = revUp + revDown || 1;
    
    const result = {
      model: {
        bullish: Math.round((mlUp / mlTotal) * 100),
        bearish: Math.round((mlDown / mlTotal) * 100),
        neutral: 0
      },
      balance: {
        above: Math.round((fgAbove / fgTotal) * 100),
        below: Math.round((fgBelow / fgTotal) * 100)
      },
      momentum: {
        bullish: Math.round(rsiAbove),
        bearish: Math.round(rsiBelow)
      },
      sr: {
        atSupport: support,
        atResistance: resistance,
        neutral: 0
      },
      reversal: {
        up: Math.round((revUp / revTotal) * 100),
        down: Math.round((revDown / revTotal) * 100),
        neutral: 0
      },
      lastUpdate: new Date().toLocaleTimeString(),
      date: latestRow[0],
      raw: {
        mlUp, mlDown, fgAbove, fgBelow, rsiAbove, support, resistance, revUp, revDown
      }
    };
    
    console.log('Swing Market Position:', JSON.stringify(result, null, 2));
    res.json(result);
  } catch (error) {
    console.error('Error fetching swing data:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sheets-meta', async (req, res) => {
  try {
    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.get({ spreadsheetId: EOD_SHEET_ID });
    const sheetNames = response.data.sheets.map(s => s.properties.title);
    
    res.json({ sheets: sheetNames });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  GET /api/market-position - Market Position Structure data');
  console.log('  GET /api/sheets/:range - Raw sheet data');
  console.log('  GET /api/sheets-meta - Sheet metadata');
});
