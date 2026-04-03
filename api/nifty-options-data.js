import { google } from 'googleapis';

const SPREADSHEET_ID = '1YYoW4dG9DrOWGAE0jNqmvnS65M6MpLVa4WGlWNYd4iU';

function getCredentials() {
    const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!key) {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable not set');
    }

    try {
        let cleanKey = key.trim();

        // Remove potential surrounding quotes from Vercel env var
        if ((cleanKey.startsWith("'") && cleanKey.endsWith("'")) ||
            (cleanKey.startsWith('"') && cleanKey.endsWith('"'))) {
            cleanKey = cleanKey.slice(1, -1).trim();
        }

        // In case the key was double-encoded as a JSON string
        let credentials;
        try {
            credentials = JSON.parse(cleanKey);
            if (typeof credentials === 'string') {
                credentials = JSON.parse(credentials);
            }
        } catch (e) {
            throw new Error(`JSON Parse Error: ${e.message}`);
        }

        if (credentials && credentials.private_key) {
            // Robustly replace escaped newlines
            credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');

            // Remove any leading/trailing quotes that might have been accidentally included in the private_key value
            credentials.private_key = credentials.private_key.trim();
            if (credentials.private_key.startsWith('"') && credentials.private_key.endsWith('"')) {
                credentials.private_key = credentials.private_key.slice(1, -1).replace(/\\n/g, '\n');
            }
        }
        return credentials;
    } catch (e) {
        throw new Error(`Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY: ${e.message}`);
    }
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
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
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error in nifty-options-data api:', error);
        return res.status(500).json({ error: 'Failed to fetch Nifty Options data', message: error.message });
    }
}