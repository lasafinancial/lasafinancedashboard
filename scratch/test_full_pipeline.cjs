const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

function getCredentials() {
  const keyPath = path.join(__dirname, '..', 'secerate_googlekey', 'key-partition-484615-n5-3411b9e54bd0.json');
  return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
}

function colToIdx(col) {
  let idx = 0;
  for (let i = 0; i < col.length; i++) {
    idx = idx * 26 + (col.toUpperCase().charCodeAt(i) - 64);
  }
  return idx - 1;
}

function rowsToObjects(rows) {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0].map(h => (h || '').toString().trim());
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] !== undefined ? row[i] : ''; });
    return obj;
  });
}

async function test() {
  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] });
  const sheets = google.sheets({ version: 'v4', auth });

  // Step 1: Fetch lasa-master (same as api/fetch-data.js)
  console.log('Fetching lasa-master...');
  const lasaMasterRes = await sheets.spreadsheets.values.get({ spreadsheetId: EOD_SHEET_ID, range: 'lasa-master!A:FZ' });

  // Step 2: Try allstocks (will fail, same as production)
  let allstocksRes;
  try {
    allstocksRes = await sheets.spreadsheets.values.get({ spreadsheetId: EOD_SHEET_ID, range: "'allstocks'!A1:ZZ" });
  } catch (e) {
    try {
      allstocksRes = await sheets.spreadsheets.values.get({ spreadsheetId: EOD_SHEET_ID, range: "'all stocks'!A1:ZZ" });
    } catch (e2) {
      console.log('No allstocks tab found, using lasa-master fallback');
      allstocksRes = { data: { values: [] } };
    }
  }

  // Step 3: Simulate stockData building from lasa-master
  const masterRows = lasaMasterRes.data.values || [];
  const masterData = rowsToObjects(masterRows);
  console.log(`lasa-master rows (data, no header): ${masterData.length}`);

  // Build history map (exactly like api/fetch-data.js)
  const history = {};
  let parsedCount = 0;
  masterData.forEach(row => {
    const id = (row['ID'] || row['STOCK_NAME'] || '').toString().trim().toUpperCase();
    if (!id) return;
    if (!history[id]) history[id] = [];
    parsedCount++;
    const closeStr = (row['CLOSE_PRICE'] || row[colToIdx('E')] || '').toString().replace(/,/g, '');
    history[id].push({
      price: parseFloat(closeStr) || 0,
      symbol: id,
    });
  });

  // Build stockData
  const stockData = Object.keys(history).map(symbol => {
    const stockHistory = history[symbol];
    if (stockHistory.length === 0) return null;
    return { symbol, price: stockHistory[stockHistory.length - 1].price, history: stockHistory };
  }).filter(Boolean);
  console.log(`stockData count: ${stockData.length}`);

  // Step 4: Parse allstocks/lasa-master for OBV signals (exact same logic as api/fetch-data.js)
  const currentObvSignalMap = new Map();
  const currentFrMap = new Map();

  const allstocksData = (allstocksRes && allstocksRes.data && allstocksRes.data.values && allstocksRes.data.values.length > 0)
    ? allstocksRes.data.values
    : (lasaMasterRes && lasaMasterRes.data && lasaMasterRes.data.values ? lasaMasterRes.data.values : []);

  console.log(`allstocksData source rows: ${allstocksData.length}`);

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

    console.log(`Header resolution: idIdx=${idIdx} (header: ${headers[idIdx]}), obvIdx=${obvIdx} (header: ${headers[obvIdx]}), frIdx=${frIdx} (header: ${headers[frIdx]})`);

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
        const obvSignal = (rawRow[obvIdx] || '').toString().trim();
        const frValue = (rawRow[frIdx] || '').toString().trim();

        uniqueSyms.forEach(sym => {
          if (sym) {
            if (obvSignal) currentObvSignalMap.set(sym, obvSignal);
            if (frValue) currentFrMap.set(sym, frValue);
          }
        });
      }
    }

    // Step 5: Attach to stockData (the new code we added)
    stockData.forEach(s => {
      const symUpper = (s.symbol || '').toUpperCase();
      const symClean = symUpper.replace(/[^A-Z0-9]/g, '');
      s.obvSignal = currentObvSignalMap.get(symUpper) || currentObvSignalMap.get(symClean) || '—';
      s.fr = currentFrMap.get(symUpper) || currentFrMap.get(symClean) || '—';
    });

    console.log(`OBV Signal Map size: ${currentObvSignalMap.size}`);
    console.log(`FR Map size: ${currentFrMap.size}`);
  }

  // Step 6: Simulate ObvAccumulation.tsx filter
  let matchCount = 0;
  const matches = [];
  stockData.forEach(s => {
    const isYes = String(s.fr || "").toUpperCase() === "YES";
    const isAcc = String(s.obvSignal || "").toUpperCase() === "ACCUMULATION" || String(s.obvSignal || "").toUpperCase() === "BULLISH";
    if (isYes && isAcc) {
      matchCount++;
      if (matches.length < 10) matches.push({ symbol: s.symbol, fr: s.fr, obvSignal: s.obvSignal });
    }
  });

  console.log(`\n=== FINAL RESULT ===`);
  console.log(`Stocks matching OBV Accumulation filter (fr=YES + obvSignal=ACCUMULATION): ${matchCount}`);
  console.log(`Sample:`, matches);

  // Also check: what does stockData[0] look like?
  if (stockData.length > 0) {
    const sample = stockData.find(s => s.fr === 'YES');
    console.log(`\nSample stockData item with fr=YES:`, sample ? { symbol: sample.symbol, fr: sample.fr, obvSignal: sample.obvSignal, price: sample.price } : 'NONE FOUND');
  }
}

test().catch(console.error);
