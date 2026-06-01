const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length > 0) {
    env[key.trim()] = val.join('=').trim().replace(/^"/, '').replace(/"$/, '');
  }
});

const EOD_SHEET_ID = env.EOD_SHEET_ID || '1l-2Y8DkQW65Zf5NncH368Kk-nOfqMtsuV9W9n5Vj11E';

function getCredentials() {
  const privateKey = (env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, '\n');
  if (!privateKey) {
    console.error("FIREBASE_PRIVATE_KEY is missing from .env");
    process.exit(1);
  }
  return {
    client_email: env.FIREBASE_CLIENT_EMAIL,
    private_key: privateKey,
  };
}

async function checkSheet() {
  try {
    const credentials = getCredentials();
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: EOD_SHEET_ID,
      range: "'intraday-commentry'!A1:Z5000",
    });
    
    const rows = res.data.values;
    if (!rows || rows.length === 0) {
      console.log("No data found.");
      return;
    }
    
    console.log("--- HEADERS (Row 0) ---");
    rows[0].forEach((col, idx) => console.log(`${idx}: ${col}`));
    
    console.log("\n--- LAST ROW ---");
    const lastRow = rows[rows.length - 1];
    lastRow.forEach((col, idx) => console.log(`${idx}: ${col}`));
    
    console.log("\nTotal columns in last row:", lastRow.length);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

checkSheet();
