import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

async function run() {
  const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
  const env = {};
  envFile.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length > 0) env[key.trim()] = val.join('=').trim().replace(/^\"|\"$/g, '').replace(/\\n/g, '\n');
  });
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_KEY),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I',
    range: "'intraday-commentry'!A1:C10"
  });
  console.log('intraday-commentry rows:', res.data.values ? res.data.values.length : 0);
  console.log(res.data.values);
}
run().catch(console.error);
