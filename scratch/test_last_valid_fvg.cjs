const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) return;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  });
}

if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
  const keyPath = path.join(__dirname, '..', 'secerate_googlekey', 'key-partition-484615-n5-3411b9e54bd0.json');
  if (fs.existsSync(keyPath)) {
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = fs.readFileSync(keyPath, 'utf8');
  }
}

async function main() {
  const { default: handler } = await import('../api/fetch-data.js');
  let jsonOutput = null;
  const mockReq = { method: 'GET', query: {} };
  const mockRes = {
    setHeader: () => {},
    status: () => mockRes,
    json: (data) => { jsonOutput = data; return mockRes; },
    send: () => {}
  };

  await handler(mockReq, mockRes);
  if (!jsonOutput) return;

  const stocks = jsonOutput.stockData || [];
  const accStocks = stocks.filter(s => {
    const isYes = String(s.fr || '').toUpperCase() === 'YES';
    const isAcc = String(s.obvSignal || '').toUpperCase() === 'ACCUMULATION' || String(s.obvSignal || '').toUpperCase() === 'BULLISH';
    return isYes && isAcc;
  });

  console.log(`Total OBV Accumulation stocks: ${accStocks.length}`);

  let withLatestFvg = 0;
  let withLastValidFvg = 0;

  accStocks.forEach(s => {
    const history = s.history || [];
    const latest = history[history.length - 1];
    const latestFvg = latest?.projFvg;
    const lastValidFvg = history.slice().reverse().find(h => h.projFvg && h.projFvg > 0)?.projFvg;

    if (latestFvg && latestFvg > 0) withLatestFvg++;
    if (lastValidFvg && lastValidFvg > 0) withLastValidFvg++;
  });

  console.log(`With latest FVG (only checking last candle): ${withLatestFvg}`);
  console.log(`With last valid FVG (looking back in history like StockAnalysis.tsx): ${withLastValidFvg}`);

  // Display sample values
  const samples = accStocks.map(s => {
    const history = s.history || [];
    const lastValidFvg = history.slice().reverse().find(h => h.projFvg && h.projFvg > 0)?.projFvg;
    return {
      symbol: s.symbol,
      price: s.price,
      balance: lastValidFvg || '—',
      obvSignal: s.obvSignal
    };
  }).filter(s => s.balance !== '—').slice(0, 10);

  console.log('\nSample Accumulation stocks WITH Balance:');
  console.table(samples);
}

main().catch(console.error);
