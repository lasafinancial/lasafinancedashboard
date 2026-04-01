const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const keyPath = 'c:\\Users\\THARAN\\Downloads\\LASA dashboard\\market-pulse-dashboard-main\\secerate_googlekey\\key-partition-484615-n5-3411b9e54bd0.json';
const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

async function main() {
    const auth = new google.auth.GoogleAuth({
        keyFile: keyPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    console.log('Fetching headers from intraday-summary...');
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: EOD_SHEET_ID,
            range: "'intraday-summary'!A1:U1",
        });
        console.log('HEADERS:', JSON.stringify(res.data.values[0], null, 2));
    } catch (err) {
        console.error('FAILED TO FETCH HEADERS:', err.message);
    }
}

main().catch(console.error);
