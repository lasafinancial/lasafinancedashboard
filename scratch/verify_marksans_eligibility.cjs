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

async function verify() {
  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const [breakoutRes, devRes] = await Promise.all([
    sheets.spreadsheets.values.get({ spreadsheetId: EOD_SHEET_ID, range: "'intraday-breakout-scanner'!A:AC" }),
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
  const firstAppearanceMap = {};

  breakoutRows.slice(1).forEach(r => {
    const sym = (r[0] || '').toString().trim().toUpperCase();
    const date = (r[1] || '').toString().trim();
    const timeStr = (r[2] || '').toString().trim();
    const boVal = (r[boColIdx] !== undefined && r[boColIdx] !== null) ? r[boColIdx].toString().trim() : '';

    if (!sym || (latestDate && date !== latestDate)) return;

    const timeMinutes = parseTime(timeStr);
    if (firstAppearanceMap[sym] === undefined || timeMinutes < firstAppearanceMap[sym]) {
      firstAppearanceMap[sym] = timeMinutes;
    }

    if (!historicalBoTodayMap[sym]) historicalBoTodayMap[sym] = [];
    historicalBoTodayMap[sym].push({
      timeMinutes: timeMinutes,
      val: boVal
    });
  });

  Object.keys(historicalBoTodayMap).forEach(sym => {
    historicalBoTodayMap[sym].sort((a, b) => a.timeMinutes - b.timeMinutes);
  });

  const getHistoricalBoToday = (sym, targetTimeStr, fallbackVal) => {
    const entries = historicalBoTodayMap[sym];
    if (!entries || entries.length === 0) return fallbackVal;
    const targetMin = parseTime(targetTimeStr);
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
      const histValV = getHistoricalBoToday(sym, timePoint, '0');
      return { symbol: sym, time: (latest[1] || '').toString(), valV: histValV };
    });

    return { timePoint, stocks };
  });

  console.log("=== MARKSANS PLAYBACK SNAPSHOT TEST ===");
  const testTimes = ['09:15', '09:30', '09:40', '09:50', '10:00', '10:14', '10:15', '10:20', '10:30'];
  testTimes.forEach(t => {
    const snap = playbackSnapshots.find(s => s.timePoint === t);
    const marksans = snap ? snap.stocks.find(s => s.symbol === 'MARKSANS') : undefined;
    if (marksans) {
      console.log(`Time [${t}] -> MARKSANS PRESENT | BO_TODAY = ${marksans.valV}`);
    } else {
      console.log(`Time [${t}] -> MARKSANS ABSENT (CORRECT)`);
    }
  });

  console.log("\n=== JINDWORLD PLAYBACK SNAPSHOT TEST (First Appeared 09:55) ===");
  ['09:15', '09:40', '09:50', '09:55', '10:00'].forEach(t => {
    const snap = playbackSnapshots.find(s => s.timePoint === t);
    const jind = snap ? snap.stocks.find(s => s.symbol === 'JINDWORLD') : undefined;
    if (jind) {
      console.log(`Time [${t}] -> JINDWORLD PRESENT | BO_TODAY = ${jind.valV}`);
    } else {
      console.log(`Time [${t}] -> JINDWORLD ABSENT (CORRECT)`);
    }
  });

  console.log("\n=== MANINDS PLAYBACK SNAPSHOT TEST (First Appeared 09:15) ===");
  ['09:15', '09:40', '10:15'].forEach(t => {
    const snap = playbackSnapshots.find(s => s.timePoint === t);
    const maninds = snap ? snap.stocks.find(s => s.symbol === 'MANINDS') : undefined;
    if (maninds) {
      console.log(`Time [${t}] -> MANINDS PRESENT | BO_TODAY = ${maninds.valV}`);
    } else {
      console.log(`Time [${t}] -> MANINDS ABSENT`);
    }
  });
}

verify().catch(console.error);
