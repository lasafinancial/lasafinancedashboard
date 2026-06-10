const fs = require('fs');

let c = fs.readFileSync('api/fetch-data.js', 'utf8');

// 1. Make allstocks fetch graceful in Promise.all
c = c.replace(
  /safeFetch\(\{ spreadsheetId: EOD_SHEET_ID, range: "'allstocks'!A1:FZ" \}\),/,
  "sheets.spreadsheets.values.get({ spreadsheetId: EOD_SHEET_ID, range: \"'allstocks'!A1:FZ\" }).catch(e => { console.warn('Failed to fetch allstocks tab:', e.message); return { data: { values: [] } }; }),"
);

// 2. Update the OBV signal mapping to try all three data sources (allstocks, lasaMaster, current)
// Find the block where allstocksData is mapped
const obvMappingRegex = /try \{\s*const allstocksRows = allstocksRes\.data\.values \|\| \[\];[\s\S]*?\} catch \(err\) \{\s*console\.warn\('Failed to parse allstocks for OBV signal:', err\.message\);\s*\}/;

const robustMappingCode = `
  try {
    // Collect from all possible sources to be completely bulletproof
    const sources = [
      { name: 'allstocks', data: allstocksRes ? (allstocksRes.data.values || []) : [] },
      { name: 'lasaMaster', data: lasaMasterRes ? (lasaMasterRes.data.values || []) : [] },
      { name: 'current', data: currentRes ? (currentRes.data.values || []) : [] }
    ];

    sources.forEach(source => {
      if (source.data.length > 1) {
        const parsed = rowsToObjects(source.data);
        parsed.forEach(row => {
          const sym = (row['ID'] || row[colToIdx('C')] || '').toString().trim().toUpperCase();
          if (sym) {
            const obvSignal = (row['OBV_SIGNAL'] || row[colToIdx('FO')] || '').toString().trim();
            // If we found a valid signal, set it (this overrides empty/missing ones)
            if (obvSignal && obvSignal !== '—' && obvSignal !== 'NO DATA' && obvSignal !== '#N/A') {
              currentObvSignalMap.set(sym, obvSignal);
            } else if (!currentObvSignalMap.has(sym)) {
               // Initialize with '—' or 'NO DATA' if it's the first time we see the symbol
               currentObvSignalMap.set(sym, obvSignal || '—');
            }
          }
        });
      }
    });
  } catch (err) {
    console.warn('Failed to parse sources for OBV signal:', err.message);
  }
`;

c = c.replace(obvMappingRegex, robustMappingCode);

fs.writeFileSync('api/fetch-data.js', c);
console.log('Successfully patched fetch-data.js for robust OBV mapping');
