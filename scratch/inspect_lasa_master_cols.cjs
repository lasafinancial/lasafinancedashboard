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

  console.log('Fetching lasa-master!A1:ZZ...');
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: "'lasa-master'!A1:ZZ",
  });

  const rows = res.data.values || [];
  console.log(`Total rows in lasa-master: ${rows.length}`);
  if (rows.length === 0) return;

  const headers = rows[0].map(h => (h || '').toString().trim().toUpperCase());
  
  const colFK = colToIdx('FK');
  const colAO = colToIdx('AO');
  const colC = colToIdx('C');
  const colE = colToIdx('E'); // close price

  console.log(`Header at FK (${colFK}): "${rows[0][colFK]}"`);
  console.log(`Header at AO (${colAO}): "${rows[0][colAO]}"`);
  console.log(`Header at C (${colC}): "${rows[0][colC]}"`);
  console.log(`Header at E (${colE}): "${rows[0][colE]}"`);

  const targetSyms = ['ITI', 'JBCHEPHARM', 'KIMS', 'KIRLOSBROS', 'KSB', 'LICHSGFIN', 'LUPIN', 'MAHABANK', 'MAPMYINDIA', 'MAXHEALTH', 'MEDANTA', 'MRPL', 'NESTLEIND', 'NH', 'NYKAA', 'PAGEIND', 'PFC'];

  console.log('\n--- STOCK DATA IN lasa-master TAB ---');
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const sym = (row[colC] || '').toString().trim().toUpperCase();
    if (targetSyms.includes(sym)) {
      const fkVal = row[colFK] !== undefined ? row[colFK] : 'N/A';
      const aoVal = row[colAO] !== undefined ? row[colAO] : 'N/A';
      const closeVal = row[colE] !== undefined ? row[colE] : 'N/A';
      console.log(`${sym.padEnd(12)} | Close (Col E): ${closeVal.padEnd(8)} | Model Price (Col AO): ${aoVal.padEnd(8)} | Model % (Col FK): ${fkVal}`);
    }
  }
}

test().catch(console.error);
