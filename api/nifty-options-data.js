import { google } from 'googleapis';
import { getGoogleCredentialsHelper } from './_credentialsHelper.js';

const SPREADSHEET_ID = '1YYoW4dG9DrOWGAE0jNqmvnS65M6MpLVa4WGlWNYd4iU';

// Simple in-memory cache to handle rapid user hits and prevent 429 Quota Exceeded
let cachedData = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 1000; // 60 seconds

function getCredentials() {
    return getGoogleCredentialsHelper();
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const now = Date.now();
        if (cachedData && (now - lastFetchTime < CACHE_DURATION)) {
            console.log('[NIFTY-OPTIONS] Returning cached data due to quota safety.');
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
            return res.status(200).json([]);
        }

        const headers = rows[0];
        const data = rows.slice(1).map(row => {
            let obj = {};
            headers.forEach((header, i) => {
                obj[header] = row[i] !== undefined ? row[i] : "";
            });
            return obj;
        });

        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
        
        // Update local cache
        cachedData = data;
        lastFetchTime = Date.now();
        
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error in nifty-options-data api:', error);
        return res.status(500).json({ error: 'Failed to fetch Nifty Options data', message: error.message });
    }
}