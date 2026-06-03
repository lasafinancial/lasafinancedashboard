import handler from '../api/fetch-data.js';
import fs from 'fs';
import path from 'path';

async function test() {
  // Load env variables
  const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length > 0) {
      process.env[key.trim()] = val.join('=').trim().replace(/^\"|\"$/g, '').replace(/\\n/g, '\n');
    }
  });

  // Load local key file if GOOGLE_SERVICE_ACCOUNT_KEY is not set
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    const localKeyPath = path.join(process.cwd(), 'secerate_googlekey', 'key-partition-484615-n5-3411b9e54bd0.json');
    if (fs.existsSync(localKeyPath)) {
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY = fs.readFileSync(localKeyPath, 'utf8');
      console.log('Loaded credentials from local key-partition file.');
    }
  }

  const req = { query: {} };
  const res = {
    statusCode: 200,
    headers: {},
    setHeader(name, val) {
      this.headers[name] = val;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      console.log('RESPONSE STATUS:', this.statusCode);
      if (this.statusCode !== 200) {
        console.error('ERROR RESPONSE:', data);
      } else {
        console.log('SUCCESS! Keys in response:', Object.keys(data));
        console.log('intradayDev length:', data.intradayDev ? data.intradayDev.length : 0);
        console.log('nearResistance length:', data.nearResistance ? data.nearResistance.length : 0);
      }
    }
  };

  await handler(req, res);
}

test().catch(console.error);
