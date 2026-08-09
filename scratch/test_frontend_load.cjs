// Simulate ObvAccumulation.tsx processedStocks filter logic
const http = require('http');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, { timeout: 60000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse error: ' + data.substring(0, 500))); }
      });
    }).on('error', reject);
  });
}

async function main() {
  const data = await fetchJson('http://localhost:3001/api/fetch-data?force=true');
  const stockData = data.stockData || [];
  const rawStocks = data.intradayBreakoutScanner || [];
  const intradayBreakout = data.intradayBreakout || [];

  const latestBySymbol = new Map();
  if (rawStocks) {
      rawStocks.forEach(stock => {
          const currentLatest = latestBySymbol.get(stock.symbol);
          const stockDateTime = new Date(`${stock.date} ${stock.time}`).getTime();
          
          if (!currentLatest || stockDateTime > currentLatest.time) {
              latestBySymbol.set(stock.symbol, { stock, time: stockDateTime });
          }
      });
  }
  
  let processed = stockData.map(stock => {
      const latestScannerEntry = latestBySymbol.get(stock.symbol)?.stock;
      const boData = intradayBreakout?.find((bo) => bo.symbol === stock.symbol);
      
      const history = stock.history || [];
      const latest = history[history.length - 1];
      
      return {
          symbol: stock.symbol,
          close: stock.price,
          resistance: latest?.resistance || latestScannerEntry?.resistance,
          model: latestScannerEntry?.model || latest?.mlFutPrice20d,
          mlGap: latestScannerEntry?.mlGap || 0,
          balance: latest?.projFvg || latestScannerEntry?.BALANCE || latestScannerEntry?.balance || boData?.BALANCE || "—",
          fr: stock.fr || latestScannerEntry?.fr || "—",
          obvSignal: stock.obvSignal || latestScannerEntry?.obvSignal || "—"
      };
  });

  // Apply static filters: accumulation and yes
  processed = processed.filter(stock => {
      const isYes = String(stock.fr || "").toUpperCase() === "YES";
      const isAcc = String(stock.obvSignal || "").toUpperCase() === "ACCUMULATION" || String(stock.obvSignal || "").toUpperCase() === "BULLISH";
      return isYes && isAcc;
  });

  console.log(`Processed stocks count (frontend simulation): ${processed.length}`);
  console.log(`Sample of first 10 processed stocks:`, processed.slice(0, 10));
}

main().catch(console.error);
