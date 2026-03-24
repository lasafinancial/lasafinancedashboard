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

    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: EOD_SHEET_ID,
        range: "'intraday-commentry'!A1:Z5000",
    });

    const rows = res.data.values;
    const olectraRows = rows.filter(r => r[0] === 'OLECTRA');
    console.log('OLECTRA LATEST ROWS:', JSON.stringify(olectraRows.slice(-3), null, 2));
}

main().catch(console.error);
