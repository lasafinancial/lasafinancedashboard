const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const keyPath = 'c:\\Users\\THARAN\\Downloads\\LASA dashboard\\market-pulse-dashboard-main\\secerate_googlekey\\key-partition-484615-n5-3411b9e54bd0.json';
const EOD_SHEET_ID = '1L9I7N_XU9KTYo04P3f6G42uS1nUu5Y0r7J4z7Z4w5A8';

async function main() {
    const auth = new google.auth.GoogleAuth({
        keyFile: keyPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: EOD_SHEET_ID,
        range: "'intraday-commentry'!A1:Z1",
    });

    console.log('HEADERS:', JSON.stringify(res.data.values[0], null, 2));
}

main().catch(console.error);
