// Production server for self-hosting (e.g. a Hostinger VPS) instead of Vercel.
//
// - Serves the built site from dist/ with the same SPA fallback as vercel.json
// - Runs every Vercel-style function in api/ unchanged: api/foo.js -> /api/foo,
//   api/razorpay/create-order.js -> /api/razorpay/create-order
// - Optionally runs the vercel.json cron jobs (set ENABLE_CRON=true)
//
// Start with: npm run build && npm start

import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API_DIR = path.join(ROOT, 'api');
const DIST_DIR = path.join(ROOT, 'dist');

// Load .env (secrets) if present; real environment variables take precedence.
try {
  process.loadEnvFile(path.join(ROOT, '.env'));
} catch {
  // No .env file: rely on the environment
}

const PORT = Number(process.env.PORT) || 3000;
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true); // behind Nginx

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ---------- API functions ----------
function findApiFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : findApiFiles(full);
    return entry.name.endsWith('.js') ? [full] : [];
  });
}

const routes = [];
for (const file of findApiFiles(API_DIR)) {
  const mod = await import(pathToFileURL(file).href);
  const handler = mod.default;
  if (typeof handler !== 'function') continue; // shared helpers such as credentialsHelper.js

  const route = '/api/' + path.relative(API_DIR, file).replace(/\\/g, '/').replace(/\.js$/, '');
  routes.push(route);
  app.all(route, async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error(`[api] ${route} failed:`, err);
      if (!res.headersSent) res.status(500).json({ error: 'Internal Server Error' });
    }
  });
}
console.log(`[api] Mounted ${routes.length} functions:\n  ${routes.join('\n  ')}`);

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// ---------- Static site ----------
app.use(
  express.static(DIST_DIR, {
    index: false,
    redirect: false, // e.g. dist/about/ holds images; /about must still be the SPA page
    setHeaders(res, filePath) {
      // Vite fingerprints files in /assets, so they can be cached forever
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  })
);

// SPA fallback, matching vercel.json: any non-API path without a file extension gets index.html
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if (path.extname(req.path)) return res.status(404).end();
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[server] Listening on http://127.0.0.1:${PORT}`);
});

// ---------- Cron jobs (same schedules as vercel.json, which are in UTC) ----------
// Off by default so a test server running alongside Vercel doesn't send duplicate notifications.
const CRON_JOBS = [
  { path: '/api/cron-update', utc: '06:00' },      // 11:30 IST
  { path: '/api/send-market-mood', utc: '09:00' }, // 14:30 IST
];

if (process.env.ENABLE_CRON === 'true') {
  const lastRun = new Map();
  setInterval(async () => {
    const now = new Date();
    const hhmm = now.toISOString().slice(11, 16);
    const day = now.toISOString().slice(0, 10);
    for (const job of CRON_JOBS) {
      if (job.utc !== hhmm || lastRun.get(job.path) === day) continue;
      lastRun.set(job.path, day);
      try {
        const r = await fetch(`http://127.0.0.1:${PORT}${job.path}`, {
          headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
        });
        console.log(`[cron] ${job.path} -> ${r.status}`);
      } catch (err) {
        console.error(`[cron] ${job.path} failed:`, err);
      }
    }
  }, 20 * 1000);
  console.log('[cron] Enabled:', CRON_JOBS.map((j) => `${j.path} at ${j.utc} UTC`).join(', '));
} else {
  console.log('[cron] Disabled (set ENABLE_CRON=true to enable)');
}
