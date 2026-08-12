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

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: "'intraday-breakout-scanner'!A:AZ",
  });
  const rows = res.data.values || [];
  console.log(`Total rows in sheet: ${rows.length}`);
  
  const headers = rows[0];
  const boIdx = headers.findIndex(h => h && h.trim().toUpperCase() === 'BO_TODAY');
  console.log(`BO_TODAY col index: ${boIdx} (${headers[boIdx]})`);

  let countWithBO = 0;
  const sampleWithBO = [];

  rows.slice(1).forEach((r, rowNum) => {
    const boVal = r[boIdx];
    if (boVal !== undefined && boVal !== null && boVal !== '') {
      countWithBO++;
      if (sampleWithBO.length < 20) {
        sampleWithBO.push({ rowNum: rowNum + 2, symbol: r[0], date: r[1], time: r[2], boVal });
      }
    }
  });

  console.log(`Rows with non-empty BO_TODAY: ${countWithBO} out of ${rows.length - 1}`);
  console.log('Sample rows with BO_TODAY:');
  console.table(sampleWithBO);
}

test().catch(console.error);
