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

function colToIdx(colStr) {
  let result = 0;
  for (let i = 0; i < colStr.length; i++) {
    result = result * 26 + (colStr.charCodeAt(i) - 64);
  }
  return result - 1;
}

async function test() {
  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const colFKIdx = colToIdx('FK');
  const colAOIdx = colToIdx('AO');
  console.log(`FK index = ${colFKIdx}, AO index = ${colAOIdx}`);

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
            range: `'${title}'!A1:ZZ1000`
          });
          const rows = res.data.values || [];
          if (rows.length === 0) continue;

          for (let r = 0; r < rows.length; r++) {
            const rowStr = rows[r].join(' | ').toUpperCase();
            if (rowStr.includes('MAPMYINDIA') || rowStr.includes('CEINFO')) {
              console.log(`FOUND MAPMYINDIA in Spreadsheet ${sObj.name}, Tab '${title}', Row ${r + 1}:`);
              console.log(`  Col A: ${rows[r][0]}`);
              console.log(`  Col B: ${rows[r][1]}`);
              console.log(`  Col C: ${rows[r][2]}`);
              console.log(`  Col FK (index ${colFKIdx}): "${rows[r][colFKIdx]}"`);
              console.log(`  Col AO (index ${colAOIdx}): "${rows[r][colAOIdx]}"`);
            }
          }
        } catch (e) {
          // ignore error for large tabs
        }
      }
    } catch (err) {
      console.error(`Err checking ${sObj.name}:`, err.message);
    }
  }
}

test().catch(console.error);
