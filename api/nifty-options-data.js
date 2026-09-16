import { google } from 'googleapis';
import { getGoogleCredentialsHelper } from './credentialsHelper.js';

const SPREADSHEET_ID = '1YYoW4dG9DrOWGAE0jNqmvnS65M6MpLVa4WGlWNYd4iU';

let cachedData = null;
let lastFetchTime = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes (900 seconds)

function getCredentials() {
    return getGoogleCredentialsHelper();
}

function isQuotaError(err) {
    const msg = (err?.message || '').toLowerCase();
    return err?.code === 429 || err?.status === 429 || msg.includes('quota') || msg.includes('429');
}

function setCacheTier(res, tier) {
    const tiers = {
        intraday: 'public, s-maxage=900, stale-while-revalidate=3600',
        hourly: 'public, s-maxage=3600, stale-while-revalidate=7200',
        daily: 'public, s-maxage=86400, stale-while-revalidate=172800',
    };
    res.setHeader('Cache-Control', tiers[tier] || tiers.intraday);
}

function setNoStore(res) {
    res.setHeader('Cache-Control', 'no-store');
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        setNoStore(res);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    setCacheTier(res, 'intraday');

    try {
        const now = Date.now();
        if (cachedData && cachedData.length > 0 && (now - lastFetchTime < CACHE_DURATION)) {
            res.setHeader('X-Cache', 'HIT');
            return res.status(200).json(cachedData);
        }

        const credentials = getCredentials();
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: "'Nifty-Options'",
        });

        const rows = response.data.values;
        if (!rows || rows.length < 2) {
            if (cachedData && cachedData.length > 0) {
                res.setHeader('X-Cache', 'HIT');
                return res.status(200).json(cachedData);
            }
            setNoStore(res);
            return res.status(503).json({ error: 'Upstream data unavailable', message: 'No Nifty Options data in sheet' });
        }

        const headers = rows[0];
        const data = rows.slice(1).map(row => {
            let obj = {};
            headers.forEach((header, i) => {
                obj[header] = row[i] !== undefined ? row[i] : "";
            });
            return obj;
        });

        cachedData = data;
        lastFetchTime = Date.now();

        return res.status(200).json(data);
    } catch (error) {
        console.error('Error in nifty-options-data api:', error);
        if (cachedData && cachedData.length > 0) {
            res.setHeader('X-Cache', 'HIT');
            return res.status(200).json(cachedData);
        }
        setNoStore(res);
        if (isQuotaError(error)) {
            res.setHeader('Retry-After', '60');
            return res.status(429).json({ error: 'Google Sheets quota exceeded', message: error.message });
        }
        return res.status(500).json({ error: 'Failed to fetch Nifty Options data', message: error.message });
    }
}
