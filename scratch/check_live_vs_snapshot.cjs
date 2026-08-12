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

async function check() {
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
  const summaryRows = summaryRes.data.values || [];

  const intradaySummaryMap = {};
  if (summaryRows.length > 1) {
    summaryRows.slice(1).forEach(row => {
      const symbol = (row[1] || '').toString().trim().toUpperCase();
      if (!symbol) return;
      intradaySummaryMap[symbol] = {
        resistance: parseFloat((row[12] || '0').toString().replace(/[^0-9.]/g, '')) || 0,
        target: (row[9] || '').toString().trim()
      };
    });
  }

  const breakoutData = [];
  const breakoutHeaders = breakoutRows[0];
  const boIdx = breakoutHeaders ? breakoutHeaders.findIndex(h => h && h.trim().toUpperCase() === 'BO_TODAY') : -1;
  const boColIdx = boIdx !== -1 ? boIdx : 28;
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

  // Build live intradayDev stocks
  const groupedRows = {};
  devRows.slice(1).forEach(row => {
    const symbol = (row[0] || '').toString().trim();
    if (!symbol || symbol === 'N/A' || symbol === 'Symbol' || symbol === 'Date') return;
    if (!groupedRows[symbol]) groupedRows[symbol] = [];
    groupedRows[symbol].push(row);
  });

  const liveStocks = Object.values(groupedRows).map(symbolRows => {
    const latest = symbolRows[symbolRows.length - 1];
    const sym = (latest[0] || 'N/A').toString().trim().toUpperCase();
    const summary = intradaySummaryMap[sym] || {};
    const scannerData = intradayBreakoutScanner.find(s => s.symbol === sym) || {};
    const findLatest = (idx) => {
      for (let i = symbolRows.length - 1; i >= 0; i--) {
        const val = (symbolRows[i][idx] || '').toString().trim();
        if (val) return val;
      }
      return '';
    };

    return {
      symbol: sym,
      close: getNum(findLatest(5)),
      resistance: scannerData.resistance || summary.resistance || 0
    };
  });

  const livePassing = liveStocks.filter(s => s.resistance > 0 && s.close > s.resistance);
  console.log(`Live stocks passing filter (close > resistance > 0): ${livePassing.length} out of ${liveStocks.length}`);

  // Build last playback snapshot
  const rawDevData = devRows.slice(1).map(row => ({
    symbol: (row[0] || '').toString().trim().toUpperCase(),
    time: (row[1] || 'N/A').toString()
  }));

  const uniqueTimes = [...new Set(rawDevData.map(r => r.time))]
    .filter(t => t !== 'N/A')
    .sort((a, b) => parseTime(a) - parseTime(b));

  const lastTime = uniqueTimes[uniqueTimes.length - 1];
  console.log(`Last unique timestamp in playback: ${lastTime}`);

  const snapshotState = {};
  const lastTimeParsed = parseTime(lastTime);
  devRows.slice(1).forEach(row => {
    const rowTime = (row[1] || 'N/A').toString();
    if (parseTime(rowTime) <= lastTimeParsed) {
      const symbol = (row[0] || '').toString().trim().toUpperCase();
      if (!symbol || symbol === 'N/A') return;
      const firstMin = firstAppearanceMap[symbol];
      if (firstMin === undefined || firstMin > lastTimeParsed) return;
      snapshotState[symbol] = row;
    }
  });

  const lastSnapshotStocks = Object.values(snapshotState).map(latest => {
    const sym = (latest[0] || 'N/A').toString().trim().toUpperCase();
    const summary = intradaySummaryMap[sym] || {};
    const scannerData = intradayBreakoutScanner.find(s => s.symbol === sym) || {};
    return {
      symbol: sym,
      close: getNum(latest[5]),
      resistance: scannerData.resistance || summary.resistance || 0
    };
  });

  const lastSnapPassing = lastSnapshotStocks.filter(s => s.resistance > 0 && s.close > s.resistance);
  console.log(`Last snapshot stocks passing filter: ${lastSnapPassing.length} out of ${lastSnapshotStocks.length}`);
  console.log("Passing stocks in last snapshot:", lastSnapPassing.map(s => `${s.symbol} (close:${s.close}, res:${s.resistance})`).join(', '));
}

check().catch(console.error);
