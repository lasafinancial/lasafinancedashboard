import handler from '../api/fetch-data.js';
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

async function test() {
  const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length > 0) {
      process.env[key.trim()] = val.join('=').trim().replace(/^\"|\"$/g, '').replace(/\\n/g, '\n');
    }
  });

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    const localKeyPath = path.join(process.cwd(), 'secerate_googlekey', 'key-partition-484615-n5-3411b9e54bd0.json');
    if (fs.existsSync(localKeyPath)) {
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY = fs.readFileSync(localKeyPath, 'utf8');
    }
  }

  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const EOD_SHEET_ID = process.env.EOD_SHEET_ID;

  // Fetch raw intraday-commentry sheet
  const devRes = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: "'intraday-commentry'!A1:W5000"
  });

  const rows = devRes.data.values || [];
  console.log('Total rows in intraday-commentry:', rows.length);
  
  // Find JINDALSTEL rows
  const jindalRows = rows.filter(r => (r[0] || '').toString().toUpperCase().includes('JINDAL'));
  console.log('\nJINDALSTEL rows found:', jindalRows.length);
  if (jindalRows.length > 0) {
    console.log('Header row:', JSON.stringify(rows[0]));
    jindalRows.forEach((r, i) => console.log(`Row ${i}:`, JSON.stringify(r)));
  } else {
    console.log('JINDALSTEL is NOT in the intraday-commentry sheet at all!');
    console.log('This is why it does not appear in the Breakout Board v1 screener.');
    console.log('\nThe sheet is the source of truth - if the Python engine removed it, the dashboard cannot show it.');
  }
}

test().catch(console.error);
