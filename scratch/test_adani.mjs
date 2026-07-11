import handler from '../api/fetch-data.js';
import fs from 'fs';
import path from 'path';

async function test() {
  const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length > 0) {
      process.env[key.trim()] = val.join('=').trim().replace(/^\"|\"$/g, '').replace(/\\n/g, '\n');
    }
  });

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    const localKeyPath = path.join(process.cwd(), 'secerate_googlekey', 'key-partition-484615-n5-3411b9e54bd0.json');
    if (fs.existsSync(localKeyPath)) {
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY = fs.readFileSync(localKeyPath, 'utf8');
      console.log('Loaded credentials from local key-partition file.');
    }
  }

  const req = { query: {} };
  let responseData = null;
  const res = {
    statusCode: 200,
    headers: {},
    setHeader(name, val) { this.headers[name] = val; },
    status(code) { this.statusCode = code; return this; },
    json(data) {
      responseData = data;
    }
  };

  await handler(req, res);

  const sym = 'ADANIPORTS';
  const jinHist = (responseData.intradayBreakoutScanner || []).filter(s => s.symbol && s.symbol.toUpperCase() === sym);
  console.log('\n=== ADANIPORTS in intradayBreakoutScanner ===');
  console.log('Total history entries:', jinHist.length);
  if (jinHist.length > 0) {
    jinHist.forEach(h => console.log(`  date: ${h.date}, time: ${h.time}, boPrice: ${h.boPrice}`));
  }
}

test().catch(console.error);
