const fs = require('fs');
const path = require('path');

// Load environment variables manually
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

// Override google credentials if not set
if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
  const keyPath = path.join(__dirname, '..', 'secerate_googlekey', 'key-partition-484615-n5-3411b9e54bd0.json');
  if (fs.existsSync(keyPath)) {
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = fs.readFileSync(keyPath, 'utf8');
  }
}

async function testFetchData() {
  console.log('Testing api/fetch-data.js handler via dynamic import...');
  const { default: handler } = await import('../api/fetch-data.js');
  
  let jsonOutput = null;
  const mockReq = { method: 'GET', query: {} };
  const mockRes = {
    setHeader: () => {},
    status: (code) => {
      console.log('HTTP Status:', code);
      return mockRes;
    },
    json: (data) => {
      jsonOutput = data;
      return mockRes;
    },
    send: (msg) => console.log('Response send:', msg)
  };

  await handler(mockReq, mockRes);

  if (!jsonOutput) {
    console.error('No JSON output returned!');
    return;
  }

  console.log('\n--- VERIFICATION OF RETURNED DATA ---');
  console.log(`Total stockData returned: ${jsonOutput.stockData ? jsonOutput.stockData.length : 0}`);
  
  const stocksWithObv = (jsonOutput.stockData || []).filter(s => s.obvSignal && s.obvSignal !== '—');
  const stocksWithFr = (jsonOutput.stockData || []).filter(s => s.fr && s.fr !== '—');
  
  console.log(`Stocks with valid obvSignal: ${stocksWithObv.length}`);
  console.log(`Stocks with valid fr: ${stocksWithFr.length}`);

  const accumulationStocks = (jsonOutput.stockData || []).filter(s => {
    const isYes = String(s.fr || '').toUpperCase() === 'YES';
    const isAcc = String(s.obvSignal || '').toUpperCase() === 'ACCUMULATION' || String(s.obvSignal || '').toUpperCase() === 'BULLISH';
    return isYes && isAcc;
  });

  console.log(`\nStocks meeting OBV Accumulation Scan (fr===YES && obvSignal===ACCUMULATION/BULLISH): ${accumulationStocks.length}`);

  if (accumulationStocks.length > 0) {
    console.log('\nFirst 10 Accumulation Stocks:');
    console.table(accumulationStocks.slice(0, 10).map(s => ({
      symbol: s.symbol,
      name: s.name,
      price: s.price,
      obvSignal: s.obvSignal,
      fr: s.fr
    })));
  }

  // Also check intradayBreakoutScanner
  if (jsonOutput.intradayBreakoutScanner) {
    console.log(`\nTotal intradayBreakoutScanner entries: ${jsonOutput.intradayBreakoutScanner.length}`);
    const scannerWithObv = jsonOutput.intradayBreakoutScanner.filter(s => s.obvSignal && s.obvSignal !== '—');
    console.log(`intradayBreakoutScanner entries with obvSignal: ${scannerWithObv.length}`);
  }
}

testFetchData().catch(console.error);
