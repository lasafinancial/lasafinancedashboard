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

  let allstocksRes;
  try {
    allstocksRes = await sheets.spreadsheets.values.get({
      spreadsheetId: EOD_SHEET_ID,
      range: "'allstocks'!A1:ZZ",
    });
  } catch (e1) {
    try {
      allstocksRes = await sheets.spreadsheets.values.get({
        spreadsheetId: EOD_SHEET_ID,
        range: "'lasa-master'!A1:ZZ",
      });
    } catch (e2) {
      allstocksRes = { data: { values: [] } };
    }
  }

  const allstocksData = (allstocksRes && allstocksRes.data && allstocksRes.data.values) ? allstocksRes.data.values : [];
  console.log(`allstocksData row count: ${allstocksData.length}`);

  const currentObvSignalMap = new Map();
  const currentFrMap = new Map();

  if (allstocksData.length > 1) {
    const headers = allstocksData[0].map(h => (h || '').toString().trim().toUpperCase());

    let idIdx = headers.indexOf('SYMBOL');
    if (idIdx === -1) idIdx = headers.indexOf('ID');
    if (idIdx === -1) idIdx = colToIdx('C');

    let obvIdx = headers.indexOf('OBV_SIGNAL');
    if (obvIdx === -1) obvIdx = headers.indexOf('OBV SIGNAL');
    if (obvIdx === -1) obvIdx = headers.indexOf('OBV');
    if (obvIdx === -1) obvIdx = colToIdx('FO');

    let frIdx = headers.indexOf('FR');
    if (frIdx === -1) frIdx = headers.indexOf('OBV_DAILY');
    if (frIdx === -1) frIdx = colToIdx('FR');

    for (let i = 1; i < allstocksData.length; i++) {
      const rawRow = allstocksData[i];
      if (!rawRow || rawRow.length === 0) continue;

      const candidates = [
        idIdx !== -1 ? rawRow[idIdx] : null,
        rawRow[colToIdx('C')],
        rawRow[colToIdx('A')],
        rawRow[colToIdx('B')]
      ].filter(Boolean).map(s => s.toString().trim().toUpperCase());

      const uniqueSyms = new Set();
      candidates.forEach(c => {
        uniqueSyms.add(c);
        uniqueSyms.add(c.replace('.NS', ''));
        uniqueSyms.add(c.replace(/[^A-Z0-9]/g, ''));
        uniqueSyms.add(c.replace(/\s+/g, ''));
      });

      if (uniqueSyms.size > 0) {
        const obvSignal = obvIdx !== -1 && obvIdx < rawRow.length ? (rawRow[obvIdx] || '').toString().trim() : '';
        const frValue = frIdx !== -1 && frIdx < rawRow.length ? (rawRow[frIdx] || '').toString().trim() : '';

        uniqueSyms.forEach(sym => {
          if (sym) {
            if (obvSignal) currentObvSignalMap.set(sym, obvSignal);
            if (frValue) currentFrMap.set(sym, frValue);
          }
        });
      }
    }
  }

  console.log(`currentObvSignalMap count: ${currentObvSignalMap.size}`);
  console.log(`currentFrMap count: ${currentFrMap.size}`);
  console.log('Sample stock values:');
  const samples = ['ABSLAMC', 'ACE', 'ADANIENSOL', 'ADANIGREEN', 'ADANIPORTS'];
  for (const s of samples) {
    console.log(`  ${s.padEnd(12)} -> obvSignal: "${currentObvSignalMap.get(s)}", fr: "${currentFrMap.get(s)}"`);
  }
}

test().catch(console.error);
