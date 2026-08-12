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

async function test() {
  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  // 1. Fetch intraday-summary!A1:Z
  const summaryRes = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: "'intraday-summary'!A1:Z500",
  });
  const summaryRows = summaryRes.data.values || [];
  console.log(`Summary headers (Col 21 / V): "${summaryRows[0]?.[21]}"`);
  const summaryMap = {};
  summaryRows.slice(1).forEach(r => {
    const sym = (r[1] || '').toString().trim().toUpperCase();
    const valV = (r[21] || '').toString().trim();
    if (sym) summaryMap[sym] = valV;
  });

  // 2. Fetch intraday-breakout-scanner!A:AZ
  const breakoutRes = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: "'intraday-breakout-scanner'!A1:AZ",
  });
  const breakoutRows = breakoutRes.data.values || [];
  const breakoutHeaders = breakoutRows[0];
  const boIdx = breakoutHeaders.findIndex(h => h && h.trim().toUpperCase() === 'BO_TODAY');
  console.log(`Breakout headers BO_TODAY col: ${boIdx} ("${breakoutHeaders[boIdx]}")`);

  // Build per-symbol time map from intraday-breakout-scanner
  // symbol -> array of { date, time, boToday }
  const breakoutTimeMap = {};
  breakoutRows.slice(1).forEach(r => {
    const sym = (r[0] || '').toString().trim().toUpperCase();
    const date = (r[1] || '').toString().trim();
    const time = (r[2] || '').toString().trim();
    const boToday = (r[boIdx] || '').toString().trim();
    if (!sym) return;
    if (!breakoutTimeMap[sym]) breakoutTimeMap[sym] = [];
    breakoutTimeMap[sym].push({ date, time, boToday });
  });

  // Let's compare summary vs latest breakout scanner for 5 symbols
  const syms = Object.keys(summaryMap).filter(s => breakoutTimeMap[s]).slice(0, 10);
  syms.forEach(sym => {
    const sumVal = summaryMap[sym];
    const bEntries = breakoutTimeMap[sym];
    const latestB = bEntries[bEntries.length - 1];
    console.log(`Symbol: ${sym} | Summary ValV: "${sumVal}" | Latest Breakout Scanner (${latestB?.date} ${latestB?.time}): "${latestB?.boToday}" | Total records: ${bEntries.length}`);
  });
}

test().catch(console.error);
