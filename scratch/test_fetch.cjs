const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const envFile = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf-8');
const env = { ...process.env };
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length > 0) {
    env[key.trim()] = val.join('=').trim().replace(/^"/, '').replace(/"$/, '').replace(/\\n/g, '\n');
  }
});

const result = spawnSync('node', [path.join(__dirname, '..', 'api', 'fetch-data.js')], { env });
console.log(result.stdout.toString().substring(0, 1000));
console.error(result.stderr.toString());
