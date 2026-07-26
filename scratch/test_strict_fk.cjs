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

  const idIdx = colToIdx('C');
  const modelIdx = colToIdx('AO');
  const mlGapIdx = colToIdx('FK');

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
      const rawModelStr = (rawRow[modelIdx] !== undefined ? rawRow[modelIdx] : '').toString().trim();
      const modelVal = parseFloat(rawModelStr.replace(/,/g, ''));
      
      const rawMlStr = (rawRow[mlGapIdx] !== undefined ? rawRow[mlGapIdx] : '').toString().trim();
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

  const targets = ['MAPMYINDIA', 'ITI', 'JBCHEPHARM', 'MAHABANK', 'NYKAA', 'PAGEIND'];
  for (const t of targets) {
    const val = currentAllStocksMlGapMap.get(t);
    const modelP = currentAllStocksModelMap.get(t);
    console.log(`${t.padEnd(12)} | Model Price (Col AO): ${modelP} | Model % (Col FK): ${(val * 100).toFixed(2)}% (raw ratio: ${val})`);
  }
}

test().catch(console.error);
