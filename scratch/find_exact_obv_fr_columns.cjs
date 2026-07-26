const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

function getCredentials() {
  const keyPath = path.join(__dirname, '..', 'secerate_googlekey', 'key-partition-484615-n5-3411b9e54bd0.json');
  if (fs.existsSync(keyPath)) {
    return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  }
  throw new Error('No key file found');
}

function idxToCol(idx) {
  let col = '';
  let temp = idx + 1;
  while (temp > 0) {
    let rem = (temp - 1) % 26;
    col = String.fromCharCode(65 + rem) + col;
    temp = Math.floor((temp - 1) / 26);
  }
  return col;
}

async function test() {
  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const meta = await sheets.spreadsheets.get({ spreadsheetId: EOD_SHEET_ID });
  for (const s of meta.data.sheets) {
    const title = s.properties.title;
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: EOD_SHEET_ID,
      range: `'${title}'!A1:ZZ5`,
    });
    const rows = res.data.values || [];
    if (rows.length === 0) continue;
    const headers = rows[0].map(h => (h || '').toString().trim());
    console.log(`\n=== TAB: '${title}' (rows: ${rows.length}, headers: ${headers.length}) ===`);
    headers.forEach((h, i) => {
      const hU = h.toUpperCase();
      if (hU.includes('OBV') || hU.includes('SIGNAL') || hU.includes('FR') || hU.includes('ACCUMULATION') || hU.includes('DIVERGENCE') || hU.includes('BREAKOUT')) {
        console.log(`  Col ${idxToCol(i).padEnd(3)} (idx ${i}): "${h}" | Row 2: "${rows[1]?.[i]}"`);
      }
    });
  }
}

test().catch(console.error);
