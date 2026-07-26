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

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: "'current'!A1:ZZ",
  });
  const rows = res.data.values || [];
  
  const colC = colToIdx('C');
  const colE = colToIdx('E');
  const colAO = colToIdx('AO');
  const colFK = colToIdx('FK');

  const targets = ['MAPMYINDIA', 'ITI', 'JBCHEPHARM', 'MAHABANK', 'NYKAA', 'PAGEIND'];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const sym = (row[colC] || '').toString().trim().toUpperCase();
    if (targets.includes(sym)) {
      const close = parseFloat((row[colE] || '0').replace(/,/g, ''));
      const algoM = parseFloat((row[colAO] || '0').replace(/,/g, ''));
      const rawFK = row[colFK];

      let calcPercent = (close > 0 && algoM > 0) ? ((algoM - close) / close) * 100 : null;
      console.log(`${sym.padEnd(12)} | Close: ${close} | ModelPrice (Col AO): ${algoM} | Calc Model %: ${calcPercent ? calcPercent.toFixed(2) + '%' : 'N/A'} | Raw Col FK: ${rawFK}`);
    }
  }
}

test().catch(console.error);
