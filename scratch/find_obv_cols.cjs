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
  const sheetNames = meta.data.sheets.map(s => s.properties.title);

  for (const title of sheetNames) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: EOD_SHEET_ID,
        range: `'${title}'!A1:ZZ2`,
      });
      const rows = res.data.values || [];
      if (rows.length === 0) continue;
      const headers = rows[0];
      console.log(`\n=== Sheet Tab: '${title}' (headers: ${headers.length}) ===`);
      for (let i = 0; i < headers.length; i++) {
        const h = (headers[i] || '').toString().trim();
        const col = idxToCol(i);
        if (h.toUpperCase().includes('OBV') || col === 'FO' || col === 'FR' || col === 'FK' || col === 'AO') {
          console.log(`  Col ${col} (idx ${i}): "${h}" | Row 2 val: "${rows[1]?.[i]}"`);
        }
      }
    } catch (e) {
      console.error(`Error reading ${title}: ${e.message}`);
    }
  }
}

test().catch(console.error);
