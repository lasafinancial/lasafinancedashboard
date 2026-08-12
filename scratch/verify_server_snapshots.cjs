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

function parseTimeToMinutes(t) {
  if (!t || typeof t !== 'string') return 0;
  try {
    const parts = t.trim().split(':');
    if (parts.length < 2) return 0;
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  } catch (e) {
    return 0;
  }
}

async function verify() {
  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const [breakoutRes, devRes] = await Promise.all([
    sheets.spreadsheets.values.get({ spreadsheetId: EOD_SHEET_ID, range: 'intraday-breakout-scanner!A:AC' }),
    sheets.spreadsheets.values.get({ spreadsheetId: EOD_SHEET_ID, range: "'intraday-commentry'!A1:W5000" })
  ]);

  const breakoutRows = breakoutRes.data.values || [];
  const devRows = devRes.data.values || [];

  const headers = breakoutRows[0];
  const boIdx = headers ? headers.findIndex(h => h && h.trim().toUpperCase() === 'BO_TODAY') : -1;
  const boColIdx = boIdx !== -1 ? boIdx : 28;

  const dates = [...new Set(breakoutRows.slice(1).map(r => r[1]).filter(Boolean))].sort((a, b) => new Date(b) - new Date(a));
  const latestDate = dates[0];

  const historicalBoTodayMap = {};
  breakoutRows.slice(1).forEach(r => {
    const sym = (r[0] || '').toString().trim().toUpperCase();
    const date = (r[1] || '').toString().trim();
    const timeStr = (r[2] || '').toString().trim();
    const boVal = (r[boColIdx] !== undefined && r[boColIdx] !== null) ? r[boColIdx].toString().trim() : '';

    if (!sym || (latestDate && date !== latestDate)) return;
    if (!historicalBoTodayMap[sym]) historicalBoTodayMap[sym] = [];

    historicalBoTodayMap[sym].push({
      timeMinutes: parseTimeToMinutes(timeStr),
      val: boVal
    });
  });

  Object.keys(historicalBoTodayMap).forEach(sym => {
    historicalBoTodayMap[sym].sort((a, b) => a.timeMinutes - b.timeMinutes);
  });

  const getHistoricalBoToday = (sym, targetTimeStr, fallbackVal) => {
    const entries = historicalBoTodayMap[sym];
    if (!entries || entries.length === 0) return fallbackVal;
    const targetMin = parseTimeToMinutes(targetTimeStr);
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

  const rawDevData = devRows.slice(1).map(row => ({
    symbol: (row[0] || '').toString().trim().toUpperCase(),
    time: (row[1] || 'N/A').toString()
  }));

  const uniqueTimes = [...new Set(rawDevData.map(r => r.time))]
    .filter(t => t !== 'N/A')
    .sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));

  console.log(`Found ${uniqueTimes.length} unique timestamps in commentary data.`);

  const testSyms = ['MANINDS', 'EPL', 'SFL'];
  
  testSyms.forEach(sym => {
    console.log(`\n=== Verification for ${sym} across playback snapshots ===`);
    uniqueTimes.forEach(t => {
      const valV = getHistoricalBoToday(sym, t, '0');
      // Only print if there's a non-zero/non-empty historical value or at specific sample times
      if (valV !== '0' && valV !== '') {
        console.log(`Time [${t}] -> valV (BO_TODAY): ${valV}`);
      }
    });
  });
}

verify().catch(console.error);
