const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';
const SWING_SHEET_ID = '1GEhcqN8roNR1F3601XNEDjQZ1V0OfSUtMxUPE2rcdNs';
const INDICES_SHEET_ID = '1EHB65PXFold-zCt-QkMzI_nfbZTuy4hEeS9G1naXhZQ';

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

  const sheetIds = [
    { name: 'EOD', id: EOD_SHEET_ID },
    { name: 'SWING', id: SWING_SHEET_ID },
    { name: 'INDICES', id: INDICES_SHEET_ID }
  ];

  for (const sObj of sheetIds) {
    console.log(`\n=== Checking Spreadsheet: ${sObj.name} (${sObj.id}) ===`);
    try {
      const meta = await sheets.spreadsheets.get({ spreadsheetId: sObj.id });
      for (const sheet of meta.data.sheets) {
        const title = sheet.properties.title;
        try {
          const res = await sheets.spreadsheets.values.get({
            spreadsheetId: sObj.id,
            range: `'${title}'!A1:ZZ50`
          });
          const rows = res.data.values || [];
          if (rows.length === 0) continue;

          for (let r = 0; r < Math.min(rows.length, 50); r++) {
            const row = rows[r];
            for (let c = 0; c < row.length; c++) {
              const val = (row[c] || '').toString().trim();
              if (val.toUpperCase().includes('ACCUMULATION') || val.toUpperCase().includes('DISTRIBUTION') || val.toUpperCase().includes('OBV') || val.toUpperCase().includes('DAILY') || val.toUpperCase().includes('WEEKLY')) {
                console.log(`Spreadsheet ${sObj.name} | Tab '${title}' | Cell ${idxToCol(c)}${r + 1} (idx ${c}): "${val}"`);
              }
            }
          }
        } catch (e) {}
      }
    } catch (err) {}
  }
}

test().catch(console.error);
