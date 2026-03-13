const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function debugSheet() {
    const keyPath = path.join(__dirname, 'secerate_googlekey', 'key-partition-484615-n5-3411b9e54bd0.json');
    const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    const spreadsheetId = '1EHB65PXFold-zCt-QkMzI_nfbZTuy4hEeS9G1naXhZQ';

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    try {
        const range = 'DAILY_NIFTY_ANALYSIS!A1:Z10';
        const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        console.log('Contents of DAILY_NIFTY_ANALYSIS:');
        console.log(JSON.stringify(response.data.values, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    }
}

debugSheet();
