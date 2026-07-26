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
    range: "'lasa-master'!A1:ZZ",
  });
  const allstocksData = res.data.values || [];
  
  const currentAllStocksModelMap = new Map();
  const currentAllStocksMlGapMap = new Map();

  if (allstocksData.length > 1) {
    const headers = allstocksData[0].map(h => (h || '').toString().trim().toUpperCase());
    
    let idIdx = headers.indexOf('SYMBOL');
    if (idIdx === -1) idIdx = headers.indexOf('ID');
    if (idIdx === -1) idIdx = colToIdx('C');

    let modelIdx = headers.indexOf('MODEL');
    if (modelIdx === -1) modelIdx = headers.indexOf('ML_FUT_PRICE_20D');
    if (modelIdx === -1) modelIdx = colToIdx('AO');

    let mlGapIdx = headers.indexOf('ML_GAP%');
    if (mlGapIdx === -1) mlGapIdx = headers.indexOf('ML_GAP');
    if (mlGapIdx === -1) mlGapIdx = headers.indexOf('ML_TARGET_PERCENT');
    if (mlGapIdx === -1) mlGapIdx = headers.indexOf('MODEL %');
    if (mlGapIdx === -1) mlGapIdx = headers.indexOf('MODEL%');
    if (mlGapIdx === -1) mlGapIdx = colToIdx('FK');

    let closeIdx = headers.indexOf('CLOSE_PRICE');
    if (closeIdx === -1) closeIdx = headers.indexOf('LTP');
    if (closeIdx === -1) closeIdx = colToIdx('E');

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
        const cp = parseFloat((rawRow[closeIdx] || '0').toString().replace(/,/g, ''));
        
        const rawModelStr = (rawRow[modelIdx] !== undefined ? rawRow[modelIdx] : (rawRow[colToIdx('AO')] || '0')).toString().trim();
        const modelVal = parseFloat(rawModelStr.replace(/,/g, ''));
        
        const rawMlStr = (rawRow[mlGapIdx] !== undefined ? rawRow[mlGapIdx] : (rawRow[colToIdx('FK')] || '')).toString().trim();
        let mlGapVal = NaN;
        if (rawMlStr) {
          mlGapVal = parseFloat(rawMlStr.replace('%', '').replace(/,/g, ''));
          if (!isNaN(mlGapVal)) {
            if (rawMlStr.includes('%') || Math.abs(mlGapVal) > 2) {
              mlGapVal = mlGapVal / 100;
            }
          }
        }

        uniqueSyms.forEach(sym => {
          if (sym) {
            if (!isNaN(modelVal) && modelVal > 0) currentAllStocksModelMap.set(sym, modelVal);
            if (!isNaN(mlGapVal)) currentAllStocksMlGapMap.set(sym, mlGapVal);
          }
        });
      }
    }
  }

  console.log('MAPMYINDIA Model Map:', currentAllStocksModelMap.get('MAPMYINDIA'));
  console.log('MAPMYINDIA MlGap Map:', currentAllStocksMlGapMap.get('MAPMYINDIA'));
}

test().catch(console.error);
