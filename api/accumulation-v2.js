// Accumulation Scan 2.0: reads the 'Observation' tab of the Weekly-Backtest sheet.
// One row per stock per trading day (A = DATE). Returns stocks whose latest row is
// OBV_SIGNAL = ACCUMULATION and OBV_DAILY_BREAKOUT = YES, with day-over-day deltas and
// the OBV_SLOPE_NORM (column I) history for each tile's line chart.
// Read at most once an hour (in-memory cache + CDN cache).
import { google } from 'googleapis';
import { getGoogleCredentialsHelper } from './credentialsHelper.js';

const SHEET_ID = '1ZOBJbUIzlzacQXYZX8h9-Rhm_GSJIWIGbYXDFb37SgY';
const RANGE = "'Observation'!A:Q";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Column positions (0-based) in A:Q
const COL = { date: 0, id: 1, inFno: 3, close: 4, slope: 8 /* I: OBV_SLOPE_NORM */, obvSignal: 10, dailyBreakout: 11, ema9: 13, ema20: 14, trend10d: 16 };

let cached = null;
let cachedAt = 0;
let inFlight = null;

const num = (v) => {
  const n = parseFloat((v ?? '').toString().replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};
const str = (v) => (v ?? '').toString().trim();
const qualifies = (row) => str(row[COL.obvSignal]).toUpperCase() === 'ACCUMULATION' && str(row[COL.dailyBreakout]).toUpperCase() === 'YES';

export function buildAccumulationV2(values) {
  const rows = (values || []).slice(1).filter((r) => r && str(r[COL.id]) && str(r[COL.date]));
  const bySymbol = new Map();
  for (const row of rows) {
    const id = str(row[COL.id]).toUpperCase();
    if (!bySymbol.has(id)) bySymbol.set(id, []);
    bySymbol.get(id).push(row);
  }

  const dates = [...new Set(rows.map((r) => str(r[COL.date])))].sort();
  const latestDate = dates[dates.length - 1] || null;

  const stocks = [];
  for (const [id, list] of bySymbol) {
    list.sort((a, b) => (str(a[COL.date]) < str(b[COL.date]) ? -1 : 1));
    const latest = list[list.length - 1];
    if (str(latest[COL.date]) !== latestDate || !qualifies(latest)) continue;
    const prev = list.length > 1 ? list[list.length - 2] : null;

    const close = num(latest[COL.close]);
    const prevClose = prev ? num(prev[COL.close]) : null;
    const slope = num(latest[COL.slope]);
    const prevSlope = prev ? num(prev[COL.slope]) : null;

    stocks.push({
      id,
      inFno: str(latest[COL.inFno]).toUpperCase() === 'YES',
      close,
      closeChangePct: close !== null && prevClose ? Number((((close - prevClose) / prevClose) * 100).toFixed(2)) : null,
      slope,
      slopeDelta: slope !== null && prevSlope !== null ? Number((slope - prevSlope).toFixed(2)) : null,
      slopeSeries: list.map((r) => ({ date: str(r[COL.date]), value: num(r[COL.slope]), close: num(r[COL.close]) })),
      obvSignal: str(latest[COL.obvSignal]).toUpperCase(),
      dailyBreakout: str(latest[COL.dailyBreakout]).toUpperCase(),
      ema9: num(latest[COL.ema9]),
      ema20: num(latest[COL.ema20]),
      trend10d: str(latest[COL.trend10d]).toUpperCase(),
      // Newly qualified on the latest date (didn't qualify the previous trading day)
      isNew: prev ? !qualifies(prev) : true,
    });
  }

  stocks.sort((a, b) => a.id.localeCompare(b.id));
  return { asOf: latestDate, dates, totalStocks: bySymbol.size, stocks };
}

async function readSheet() {
  const credentials = getGoogleCredentialsHelper();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: RANGE });
  return buildAccumulationV2(res.data.values);
}

export default async function handler(req, res) {
  const now = Date.now();
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');

  if (cached && now - cachedAt < CACHE_TTL) {
    return res.status(200).json(cached);
  }

  try {
    if (!inFlight) {
      inFlight = readSheet()
        .then((data) => {
          if (data.stocks.length > 0 || !cached) {
            cached = { ...data, refreshedAt: new Date().toISOString() };
            cachedAt = Date.now();
          }
          return cached;
        })
        .finally(() => {
          inFlight = null;
        });
    }
    return res.status(200).json(await inFlight);
  } catch (error) {
    console.error('[accumulation-v2] Read failed:', error.message);
    if (cached) return res.status(200).json(cached);
    return res.status(500).json({ error: 'Failed to load Accumulation Scan 2.0', message: error.message });
  }
}
