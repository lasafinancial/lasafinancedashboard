const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '..', '.env');
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
  } catch (error) {}
}

loadEnvFile();

function getCredentials() {
  let credentials;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (key) {
    try {
      credentials = JSON.parse(key.trim());
    } catch (e) {}
  }
  if (!credentials) {
    const keyPath = path.join(__dirname, '..', 'secerate_googlekey', 'key-partition-484615-n5-3411b9e54bd0.json');
    if (fs.existsSync(keyPath)) {
      credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    }
  }
  if (credentials && credentials.private_key) {
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n').trim();
  }
  return credentials;
}

const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

function parseTime(t) {
  if (!t || typeof t !== 'string') return 0;
  try {
    const parts = t.trim().split(':');
    if (parts.length < 2) return 0;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    return h * 60 + m;
  } catch (e) {
    return 0;
  }
}

async function test() {
  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  // 1. Fetch intraday-breakout-scanner!A:AZ
  const breakoutRes = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: "'intraday-breakout-scanner'!A:AZ",
  });
  const breakoutRows = breakoutRes.data.values || [];
  const headers = breakoutRows[0];
  const boIdx = headers.findIndex(h => h && h.trim().toUpperCase() === 'BO_TODAY');

  // Build time-series map per symbol for today's date (or most recent date)
  // Get all dates in breakoutRows
  const dates = [...new Set(breakoutRows.slice(1).map(r => r[1]).filter(Boolean))].sort((a, b) => new Date(b) - new Date(a));
  const latestDate = dates[0];
  console.log(`Latest date in intraday-breakout-scanner: ${latestDate}`);

  // Build structure: symbol -> array of { timeMinutes, boToday }
  const boTodayMap = {};
  breakoutRows.slice(1).forEach(r => {
    const sym = (r[0] || '').toString().trim().toUpperCase();
    const date = (r[1] || '').toString().trim();
    const timeStr = (r[2] || '').toString().trim();
    const boVal = (r[boIdx] || '').toString().trim();

    if (!sym || date !== latestDate) return;
    if (!boTodayMap[sym]) boTodayMap[sym] = [];
    
    boTodayMap[sym].push({
      timeStr,
      timeMinutes: parseTime(timeStr),
      boVal
    });
  });

  // Sort entries by timeMinutes ascending for each symbol
  Object.keys(boTodayMap).forEach(sym => {
    boTodayMap[sym].sort((a, b) => a.timeMinutes - b.timeMinutes);
  });

  // Helper lookup function
  function getHistoricalBoToday(sym, targetTimeStr, fallbackVal) {
    const entries = boTodayMap[sym];
    if (!entries || entries.length === 0) return fallbackVal;
    
    const targetMin = parseTime(targetTimeStr);
    let bestVal = null;
    
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].timeMinutes <= targetMin) {
        if (entries[i].boVal !== '') {
          bestVal = entries[i].boVal;
        }
      } else {
        break;
      }
    }
    
    return bestVal !== null ? bestVal : fallbackVal;
  }

  // Test for MANINDS at various playback timestamps
  const testTimes = ['9:15:00', '9:20:00', '10:00:00', '11:40:00', '14:05:00'];
  const testSymbols = ['MANINDS', 'EPL', 'RELIGARE', 'SFL'];

  testSymbols.forEach(sym => {
    console.log(`\n--- Testing ${sym} playback lookup ---`);
    testTimes.forEach(t => {
      const val = getHistoricalBoToday(sym, t, 'N/A');
      console.log(`Playback time ${t} => BO_TODAY: "${val}"`);
    });
  });
}

test().catch(console.error);
