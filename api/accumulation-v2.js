// Accumulation Scan 2.0: reads the 'Observation' tab of the Weekly-Backtest sheet.
// One row per stock per period (weekly: WEEK_ENDING, or daily: DATE). Returns stocks whose
// latest row is OBV_SIGNAL = ACCUMULATION with an OBV breakout (weekly or daily), with
// period-over-period deltas and the OBV_SLOPE_NORM + CLOSE history for each tile's chart.
// Columns are found by header name, so the sheet's column order can change.
// Read once per day (India time): the first request of each IST day reads the sheet, then that
// copy is served for the rest of the day.
import { google } from 'googleapis';
import { getGoogleCredentialsHelper } from './credentialsHelper.js';

const SHEET_ID = '1ZOBJbUIzlzacQXYZX8h9-Rhm_GSJIWIGbYXDFb37SgY';
const RANGE = "'Observation'!A:Z";

// Field -> accepted header names (first match wins)
const HEADERS = {
  date: ['WEEK_ENDING', 'DATE'],
  id: ['ID'],
  inFno: ['IN_FNO'],
  close: ['CLOSE'],
  slope: ['OBV_SLOPE_NORM'],
  obvSignal: ['OBV_SIGNAL'],
  breakout: ['OBV_WEEKLY_BREAKOUT', 'OBV_DAILY_BREAKOUT'],
  ema9: ['WEEKLY_EMA9'],
  ema20: ['WEEKLY_EMA20'],
  trend: ['PRICE_SLOPE_TREND_10W', 'PRICE_SLOPE_TREND_10D'],
  weeklyRsi: ['WEEKLY_RSI'],
  dailyRsi: ['DAILY_RSI'],
};

let cached = null;
let cachedDayKey = null; // IST date the cached copy was read on
let inFlight = null;

const num = (v) => {
  const n = parseFloat((v ?? '').toString().replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};
const str = (v) => (v ?? '').toString().trim();

// e.g. "2026-10-10" in India time
const istDayKey = (ms) => new Date(ms + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);

function resolveColumns(headerRow) {
  const header = (headerRow || []).map((h) => str(h).toUpperCase());
  const col = {};
  for (const [field, names] of Object.entries(HEADERS)) {
    col[field] = names.map((n) => header.indexOf(n)).find((i) => i >= 0) ?? -1;
  }
  const missing = ['date', 'id', 'close', 'slope', 'obvSignal', 'breakout'].filter((f) => col[f] < 0);
  if (missing.length) throw new Error(`Observation tab is missing columns: ${missing.join(', ')}`);
  col.period = header[col.date] === 'WEEK_ENDING' ? 'weekly' : 'daily';
  return col;
}

export function buildAccumulationV2(values) {
  const col = resolveColumns(values?.[0]);
  const get = (row, field) => (col[field] >= 0 ? row[col[field]] : undefined);
  const qualifies = (row) =>
    str(get(row, 'obvSignal')).toUpperCase() === 'ACCUMULATION' && str(get(row, 'breakout')).toUpperCase() === 'YES';

  const rows = (values || []).slice(1).filter((r) => r && str(get(r, 'id')) && str(get(r, 'date')));
  const bySymbol = new Map();
  for (const row of rows) {
    const id = str(get(row, 'id')).toUpperCase();
    if (!bySymbol.has(id)) bySymbol.set(id, []);
    bySymbol.get(id).push(row);
  }

  const dates = [...new Set(rows.map((r) => str(get(r, 'date'))))].sort();
  const latestDate = dates[dates.length - 1] || null;

  const stocks = [];
  for (const [id, list] of bySymbol) {
    list.sort((a, b) => (str(get(a, 'date')) < str(get(b, 'date')) ? -1 : 1));
    const latest = list[list.length - 1];
    if (str(get(latest, 'date')) !== latestDate || !qualifies(latest)) continue;
    const prev = list.length > 1 ? list[list.length - 2] : null;

    const close = num(get(latest, 'close'));
    const prevClose = prev ? num(get(prev, 'close')) : null;
    const slope = num(get(latest, 'slope'));
    const prevSlope = prev ? num(get(prev, 'slope')) : null;

    stocks.push({
      id,
      inFno: str(get(latest, 'inFno')).toUpperCase() === 'YES',
      close,
      closeChangePct: close !== null && prevClose ? Number((((close - prevClose) / prevClose) * 100).toFixed(2)) : null,
      slope,
      slopeDelta: slope !== null && prevSlope !== null ? Number((slope - prevSlope).toFixed(2)) : null,
      slopeSeries: list.map((r) => ({ date: str(get(r, 'date')), value: num(get(r, 'slope')), close: num(get(r, 'close')) })),
      obvSignal: str(get(latest, 'obvSignal')).toUpperCase(),
      dailyBreakout: str(get(latest, 'breakout')).toUpperCase(), // breakout for this period (weekly or daily)
      ema9: num(get(latest, 'ema9')),
      ema20: num(get(latest, 'ema20')),
      trend10d: str(get(latest, 'trend')).toUpperCase(), // 10-period price-slope trend
      weeklyRsi: num(get(latest, 'weeklyRsi')),
      dailyRsi: num(get(latest, 'dailyRsi')),
      // Newly qualified this period (didn't qualify the previous one)
      isNew: prev ? !qualifies(prev) : true,
    });
  }

  stocks.sort((a, b) => a.id.localeCompare(b.id));
  return { asOf: latestDate, period: col.period, dates, totalStocks: bySymbol.size, stocks };
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

  if (cached && cachedDayKey === istDayKey(now)) {
    return res.status(200).json(cached);
  }

  try {
    if (!inFlight) {
      inFlight = readSheet()
        .then((data) => {
          // Don't replace a full copy with a partial read (e.g. the sheet mid-rewrite)
          const partial = cached && data.totalStocks < cached.totalStocks * 0.5;
          if (partial) {
            console.warn(`[accumulation-v2] Read has ${data.totalStocks} stocks vs ${cached.totalStocks} cached; keeping cached copy.`);
          } else if (data.stocks.length > 0 || !cached) {
            cached = { ...data, refreshedAt: new Date().toISOString() };
          }
          cachedDayKey = istDayKey(Date.now());
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
