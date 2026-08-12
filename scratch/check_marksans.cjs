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

  const [breakoutRes, devRes] = await Promise.all([
    sheets.spreadsheets.values.get({ spreadsheetId: EOD_SHEET_ID, range: "'intraday-breakout-scanner'!A:AC" }),
    sheets.spreadsheets.values.get({ spreadsheetId: EOD_SHEET_ID, range: "'intraday-commentry'!A1:W5000" })
  ]);

  const breakoutRows = breakoutRes.data.values || [];
  const devRows = devRes.data.values || [];

  console.log("=== MARKSANS in intraday-breakout-scanner ===");
  breakoutRows.slice(1).forEach(r => {
    if ((r[0] || '').toString().trim().toUpperCase() === 'MARKSANS') {
      console.log(`  Date: ${r[1]} | Time: ${r[2]} | BO_TODAY: ${r[28]}`);
    }
  });

  console.log("\n=== MARKSANS in intraday-commentry ===");
  devRows.slice(1).forEach(r => {
    if ((r[0] || '').toString().trim().toUpperCase() === 'MARKSANS') {
      console.log(`  Col0: ${r[0]} | Col1 (Time/Date?): ${r[1]} | Col2: ${r[2]} | Col5 (Close): ${r[5]}`);
    }
  });
}

test().catch(console.error);
