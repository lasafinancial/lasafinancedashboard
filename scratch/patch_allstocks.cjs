const fs = require('fs');

let c = fs.readFileSync('api/fetch-data.js', 'utf8');

// 1. Add allstocksRes to Promise.all destructuring
c = c.replace(
  /currentRes,\r?\n\s*indicesRes,\r?\n\s*newsRes/,
  "currentRes,\n    allstocksRes,\n    indicesRes,\n    newsRes"
);

// 2. Add allstocks safeFetch
c = c.replace(
  /safeFetch\(\{ spreadsheetId: EOD_SHEET_ID, range: "'current'!A1:FZ" \}\),/,
  "safeFetch({ spreadsheetId: EOD_SHEET_ID, range: \"'current'!A1:FZ\" }),\n    safeFetch({ spreadsheetId: EOD_SHEET_ID, range: \"'allstocks'!A1:FZ\" }),"
);

// 3. Remove OBV signal extraction from currentData
c = c.replace(
  /const obvSignal = \(row\['OBV_SIGNAL'\] \|\| row\[colToIdx\('FO'\)\] \|\| ''\)\.toString\(\)\.trim\(\);\r?\n\s*currentObvSignalMap\.set\(sym, obvSignal\);/,
  ""
);

// 4. Add OBV signal extraction using allstocksRes before the currentData mapping block
const extractionCode = `
  try {
    const allstocksRows = allstocksRes.data.values || [];
    const allstocksData = rowsToObjects(allstocksRows);
    allstocksData.forEach(row => {
      // Use ID or fallback to column C
      const sym = (row['ID'] || row[colToIdx('C')] || '').toString().trim().toUpperCase();
      if (sym) {
        const obvSignal = (row['OBV_SIGNAL'] || row[colToIdx('FO')] || '').toString().trim();
        currentObvSignalMap.set(sym, obvSignal);
      }
    });
  } catch (err) {
    console.warn('Failed to parse allstocks for OBV signal:', err.message);
  }
`;

c = c.replace(
  /let currentObvSignalMap = new Map\(\);\r?\n\s*try \{/,
  `let currentObvSignalMap = new Map();\n${extractionCode}\n  try {`
);

fs.writeFileSync('api/fetch-data.js', c);
console.log('Successfully patched fetch-data.js to use allstocks for OBV');
