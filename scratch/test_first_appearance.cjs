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

async function test() {
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

  const dates = [...new Set(breakoutRows.slice(1).map(r => r[1]).filter(Boolean))].sort((a, b) => new Date(b) - new Date(a));
  const latestDate = dates[0];

  const firstAppearanceMap = {};
  breakoutRows.slice(1).forEach(r => {
    const sym = (r[0] || '').toString().trim().toUpperCase();
    const date = (r[1] || '').toString().trim();
    const timeStr = (r[2] || '').toString().trim();

    if (!sym || (latestDate && date !== latestDate)) return;
    const tMin = parseTimeToMinutes(timeStr);
    if (firstAppearanceMap[sym] === undefined || tMin < firstAppearanceMap[sym]) {
      firstAppearanceMap[sym] = tMin;
    }
  });

  const testSyms = ['MARKSANS', 'MANINDS', 'EPL', 'SFL', 'JINDWORLD'];
  console.log("=== First Appearance Timestamps (Latest Date: " + latestDate + ") ===");
  testSyms.forEach(sym => {
    const minTime = firstAppearanceMap[sym];
    if (minTime !== undefined) {
      const h = Math.floor(minTime / 60);
      const m = minTime % 60;
      const timeFormatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      console.log(`  ${sym}: ${timeFormatted} (${minTime} mins)`);
    } else {
      console.log(`  ${sym}: NO APPEARANCE`);
    }
  });

  const sampleTimes = ['09:15', '09:30', '09:40', '09:50', '10:00', '10:14', '10:15', '10:20', '10:30'];
  console.log("\n=== MARKSANS Playback Eligibility check ===");
  sampleTimes.forEach(t => {
    const tMin = parseTimeToMinutes(t);
    const firstMin = firstAppearanceMap['MARKSANS'];
    const eligible = (firstMin !== undefined && firstMin <= tMin);
    console.log(`  Time ${t} (${tMin}m) -> MARKSANS eligible? ${eligible ? 'YES (SHOW)' : 'NO (EXCLUDE)'}`);
  });
}

test().catch(console.error);
