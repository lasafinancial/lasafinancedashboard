const https = require('https');

const url = 'https://lasafinance.vercel.app/api/fetch-data';

console.log('Fetching from API...');
https.get(url, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const data = JSON.parse(body);
    const scannerData = data.intradayBreakoutScanner || [];
    console.log(`Total scanner records: ${scannerData.length}`);

    const today = new Date();
    today.setHours(0,0,0,0);

    // Group by symbol
    const symbolMap = {};
    scannerData.forEach(scan => {
      const sym = (scan.symbol || '').trim().toUpperCase();
      if (!sym || sym === 'N/A') return;
      const d = new Date(scan.date);
      if (isNaN(d.getTime())) return;
      if (!symbolMap[sym]) symbolMap[sym] = [];
      symbolMap[sym].push({ dateObj: d, time: scan.time || '', entry: scan });
    });

    console.log(`Total unique symbols: ${Object.keys(symbolMap).length}`);

    // Find stocks whose ONLY appearance is on July 15 (truly new)
    let newOnJul15 = 0;
    let gapNewOnJul15 = 0;
    let notNewOnJul15 = 0;
    let exampleNotNew = [];

    Object.entries(symbolMap).forEach(([sym, appearances]) => {
      appearances.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

      // Find latest new badge date (same logic as NewBreakouts.tsx)
      let latestNewBadgeDate = appearances[0].dateObj;
      for (let i = 1; i < appearances.length; i++) {
        const diffDays = (appearances[i].dateObj.getTime() - appearances[i-1].dateObj.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > 30) {
          latestNewBadgeDate = appearances[i].dateObj;
        }
      }

      const lnbd = new Date(latestNewBadgeDate);
      lnbd.setHours(0,0,0,0);
      const daysSinceNew = (today.getTime() - lnbd.getTime()) / (1000 * 60 * 60 * 24);

      // Check if any appearance is on July 15
      const hasJul15 = appearances.some(a => {
        const d = new Date(a.dateObj);
        d.setHours(0,0,0,0);
        return d.getTime() === today.getTime();
      });

      if (hasJul15) {
        if (daysSinceNew >= -2 && daysSinceNew <= 15) {
          // This stock IS marked as a new breakout
          const badgeDate = lnbd.toISOString().split('T')[0];
          if (badgeDate === today.toISOString().split('T')[0]) {
            newOnJul15++;
          } else {
            // Badge date is before today, but within 15 days
          }
        } else {
          notNewOnJul15++;
          if (exampleNotNew.length < 5) {
            exampleNotNew.push({
              sym,
              latestNewBadgeDate: lnbd.toISOString().split('T')[0],
              daysSinceNew: daysSinceNew.toFixed(1),
              totalAppearances: appearances.length,
              firstDate: appearances[0].dateObj.toISOString().split('T')[0],
              lastDate: appearances[appearances.length-1].dateObj.toISOString().split('T')[0]
            });
          }
        }

        // Check if badge date IS July 15
        const badgeDate = lnbd.toISOString().split('T')[0];
        if (badgeDate === today.toISOString().split('T')[0]) {
          gapNewOnJul15++;
        }
      }
    });

    console.log(`\n--- RESULTS ---`);
    console.log(`Stocks appearing on Jul 15 whose badge date IS Jul 15: ${gapNewOnJul15}`);
    console.log(`Stocks on Jul 15 that are filtered OUT (daysSinceNew out of range): ${notNewOnJul15}`);
    console.log(`\nExamples of Jul 15 stocks filtered out:`, JSON.stringify(exampleNotNew, null, 2));

    // Now specifically find stocks only on July 15 (no prior appearances)
    let onlyJul15 = [];
    Object.entries(symbolMap).forEach(([sym, appearances]) => {
      const jul15Only = appearances.every(a => {
        const d = new Date(a.dateObj);
        d.setHours(0,0,0,0);
        return d.getTime() === today.getTime();
      });
      if (jul15Only) {
        onlyJul15.push(sym);
      }
    });
    console.log(`\nStocks that ONLY appear on Jul 15 (no prior history): ${onlyJul15.length}`);
    if (onlyJul15.length > 0) {
      console.log('Examples:', onlyJul15.slice(0, 10));
    }

    // Stocks with 30+ day gap before Jul 15
    let gapStocks = [];
    Object.entries(symbolMap).forEach(([sym, appearances]) => {
      appearances.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
      const hasJul15 = appearances.some(a => {
        const d = new Date(a.dateObj);
        d.setHours(0,0,0,0);
        return d.getTime() === today.getTime();
      });
      if (!hasJul15) return;

      // Find appearances BEFORE Jul 15
      const beforeJul15 = appearances.filter(a => {
        const d = new Date(a.dateObj);
        d.setHours(0,0,0,0);
        return d.getTime() < today.getTime();
      });

      if (beforeJul15.length === 0) return; // already counted in onlyJul15

      const lastBefore = beforeJul15[beforeJul15.length - 1].dateObj;
      const gap = (today.getTime() - lastBefore.getTime()) / (1000 * 60 * 60 * 24);
      if (gap > 30) {
        gapStocks.push({ sym, lastBeforeDate: lastBefore.toISOString().split('T')[0], gapDays: gap.toFixed(0) });
      }
    });
    console.log(`\nStocks with 30+ day gap before Jul 15: ${gapStocks.length}`);
    if (gapStocks.length > 0) {
      console.log('Examples:', gapStocks.slice(0, 10));
    }
  });
}).on('error', e => console.error(e.message));
