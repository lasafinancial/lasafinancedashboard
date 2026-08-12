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
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  } catch (e) {
    return 0;
  }
}

function getNum(val) {
  if (val === null || val === undefined || val === '') return 0;
  const num = parseFloat(val.toString().replace(/,/g, '').trim());
  return isNaN(num) ? 0 : num;
}

async function verify() {
  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const [breakoutRes, devRes, summaryRes] = await Promise.all([
    sheets.spreadsheets.values.get({ spreadsheetId: EOD_SHEET_ID, range: "'intraday-breakout-scanner'!A:AC" }),
    sheets.spreadsheets.values.get({ spreadsheetId: EOD_SHEET_ID, range: "'intraday-commentry'!A1:W5000" }),
    sheets.spreadsheets.values.get({ spreadsheetId: EOD_SHEET_ID, range: "'intraday-summary'!A1:Z500" })
  ]);

  const breakoutRows = breakoutRes.data.values || [];
  const devRows = devRes.data.values || [];

  const dates = [...new Set(breakoutRows.slice(1).map(r => r[1]).filter(Boolean))].sort((a, b) => new Date(b) - new Date(a));
  const latestDate = dates[0];

  const firstAppearanceMap = {};
  breakoutRows.slice(1).forEach(r => {
    const sym = (r[0] || '').toString().trim().toUpperCase();
    const date = (r[1] || '').toString().trim();
    const timeStr = (r[2] || '').toString().trim();
    if (!sym || (latestDate && date !== latestDate)) return;
    const timeMinutes = parseTime(timeStr);
    if (firstAppearanceMap[sym] === undefined || timeMinutes < firstAppearanceMap[sym]) {
      firstAppearanceMap[sym] = timeMinutes;
    }
  });

  const intradayBreakoutScanner = breakoutRows.slice(1)
    .filter(r => r[0] && r[1] && r[1] === latestDate)
    .map(r => ({
      symbol: (r[0] || '').toString().trim().toUpperCase(),
      resistance: getNum(r[16]),
      target: getNum(r[21]),
      model: r[13] || 'N/A'
    }));

  const rawDevData = devRows.slice(1).map(row => ({
    symbol: (row[0] || '').toString().trim().toUpperCase(),
    time: (row[1] || 'N/A').toString()
  }));

  const uniqueTimes = [...new Set(rawDevData.map(r => r.time))]
    .filter(t => t !== 'N/A')
    .sort((a, b) => parseTime(a) - parseTime(b));

  const playbackSnapshots = uniqueTimes.map(timePoint => {
    const snapshotState = {};
    const timePointParsed = parseTime(timePoint);

    devRows.slice(1).forEach(row => {
      const rowTime = (row[1] || 'N/A').toString();
      if (parseTime(rowTime) <= timePointParsed) {
        const symbol = (row[0] || '').toString().trim().toUpperCase();
        if (!symbol || symbol === 'N/A') return;

        const firstMin = firstAppearanceMap[symbol];
        if (firstMin === undefined || firstMin > timePointParsed) {
          return;
        }

        snapshotState[symbol] = row;
      }
    });

    const stocks = Object.values(snapshotState).map(latest => {
      const sym = (latest[0] || 'N/A').toString().trim().toUpperCase();
      const scannerData = intradayBreakoutScanner.find(s => s.symbol === sym) || {};
      return {
        symbol: sym,
        close: getNum(latest[5]),
        resistance: scannerData.resistance || 0
      };
    });

    return { timePoint, stocks };
  });

  const isPlayback = false;
  const playbackIndex = 0;
  const idx = isPlayback ? playbackIndex : playbackSnapshots.length - 1;
  const defaultSnapshot = playbackSnapshots[idx];

  console.log(`Default view snapshot index: ${idx} / ${playbackSnapshots.length - 1}`);
  console.log(`Default view timestamp: ${defaultSnapshot.timePoint}`);

  const filtered = defaultSnapshot.stocks.filter(s => s.resistance > 0 && s.close > s.resistance);
  console.log(`Default view stocks passing filter: ${filtered.length}`);
  console.log(`Includes MARKSANS? ${filtered.some(s => s.symbol === 'MARKSANS') ? 'YES' : 'NO'}`);
}

verify().catch(console.error);
