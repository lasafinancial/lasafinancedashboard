const fs = require('fs');
let c = fs.readFileSync('api/fetch-data.js', 'utf8');

// 1. A:FJ -> A:FZ
c = c.replace(/lasa-master!A:FJ/g, 'lasa-master!A:FZ');
c = c.replace(/current!A:FJ/g, 'current!A:FZ');

// 2. Map definition
c = c.replace(
  /try \{\r?\n\s*const currentRows = currentRes\.data\.values \|\| \[\];/,
  `let currentObvSignalMap = new Map();\n  try {\n    \n    const currentRows = currentRes.data.values || [];`
);

// 3. Map assignment
c = c.replace(
  /currentChangePercentMap\.set\(sym, changePct\);\r?\n\s*\}/,
  `currentChangePercentMap.set(sym, changePct);\n\n        const obvSignal = (row['OBV_SIGNAL'] || row[colToIdx('FO')] || '').toString().trim();\n        currentObvSignalMap.set(sym, obvSignal);\n      }`
);

// 4. IntradayBreakoutScanner mapping
c = c.replace(
  /u: getNum\(getVal\('Price_%_Move', 10\)\),\r?\n\s*mlGap: getNum\(getVal\('ML_GAP%', 27\)\),\r?\n\s*close: getNum\(getVal\('Close', 6\)\)\r?\n\s*};\r?\n\s*}\)\r?\n\s*\.sort\(\(a, b\) => \{/,
  `u: getNum(getVal('Price_%_Move', 10)),
              mlGap: getNum(getVal('ML_GAP%', 27)),
              close: getNum(getVal('Close', 6)),
              obvSignal: currentObvSignalMap.get((getVal('Symbol', 0) || '').toString().trim().toUpperCase()) || '—'
            };
          })
          .sort((a, b) => {`
);

// 5. IntradayReversal mapping
c = c.replace(
  /dropFromHigh: getNum\(getVal\(row, dropIdx\)\),\r?\n\s*candlesSinceBreakout: getNum\(getVal\(row, candlesIdx\)\),\r?\n\s*reversalCandleTime: getVal\(row, candleTimeIdx\)\.toString\(\)\.trim\(\)\r?\n\s*}\);/,
  `dropFromHigh: getNum(getVal(row, dropIdx)),
            candlesSinceBreakout: getNum(getVal(row, candlesIdx)),
            reversalCandleTime: getVal(row, candleTimeIdx).toString().trim(),
            obvSignal: currentObvSignalMap.get(getVal(row, symbolIdx).toString().trim().toUpperCase()) || '—'
          });`
);

// 6. IntradayDev mapping
c = c.replace(
  /valW: \(latest\[21\] !== undefined && latest\[21\] !== null && latest\[21\] !== ''\) \? latest\[21\]\.toString\(\)\.trim\(\) : \(summary\.valW \|\| ''\),\r?\n\s*allSignals: symbolRows\.length,\r?\n\s*recentChanges: recentChanges\.filter\(c => c\.symbol === sym\)\r?\n\s*};\r?\n\s*}\);/,
  `valW: (latest[21] !== undefined && latest[21] !== null && latest[21] !== '') ? latest[21].toString().trim() : (summary.valW || ''),
            obvSignal: currentObvSignalMap.get(sym) || '—',
            allSignals: symbolRows.length,
            recentChanges: recentChanges.filter(c => c.symbol === sym)
          };
        });`
);

fs.writeFileSync('api/fetch-data.js', c);
