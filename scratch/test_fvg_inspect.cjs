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
  console.log(`Total stockData: ${stocks.length}`);

  let stocksWithAnyFvg = 0;
  let stocksWithLatestFvg = 0;

  stocks.forEach(s => {
    const history = s.history || [];
    const latest = history[history.length - 1];
    const latestFvg = latest ? latest.projFvg : 0;
    const anyFvg = history.some(h => h.projFvg > 0);

    if (latestFvg > 0) stocksWithLatestFvg++;
    if (anyFvg) stocksWithAnyFvg++;
  });

  console.log(`Stocks with projFvg > 0 in latest history item: ${stocksWithLatestFvg}`);
  console.log(`Stocks with projFvg > 0 in ANY history item (180 days): ${stocksWithAnyFvg}`);

  // Sample stocks that have projFvg > 0 in latest
  const samples = stocks.filter(s => s.history && s.history[s.history.length - 1]?.projFvg > 0).slice(0, 10);
  console.log('\nSample stocks with active Balance (projFvg > 0):');
  console.table(samples.map(s => {
    const latest = s.history[s.history.length - 1];
    return {
      symbol: s.symbol,
      price: s.price,
      projFvg: latest.projFvg,
      obvSignal: s.obvSignal,
      fr: s.fr
    };
  }));
}

main().catch(console.error);
