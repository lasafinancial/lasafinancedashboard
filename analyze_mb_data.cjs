const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');

function colToIdx(col) {
    let idx = 0;
    for (let i = 0; i < col.length; i++) {
        idx = idx * 26 + (col.toUpperCase().charCodeAt(i) - 64);
    }
    return idx - 1;
}

const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

async function run() {
    const keyPath = path.join('secerate_googlekey', 'key-partition-484615-n5-3411b9e54bd0.json');
    if (!fs.existsSync(keyPath)) {
        console.log('Credentials not found');
        return;
    }
    const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });
    const sheets = google.sheets({ version: 'v4', auth });

    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: EOD_SHEET_ID,
            range: "'current'!A:FI"
        });
        const rows = res.data.values;
        const idx = {
            isMb: colToIdx('BS'),
            rsiAbove78: colToIdx('FI'),
            dEma200Status: colToIdx('EP'),
            rsi: colToIdx('K')
        };

        console.log('--- Data Distribution Analysis ---');
        const counts = {};
        rows.slice(1).forEach(row => {
            const isMbVal = parseFloat((row[idx.isMb] || '0').toString().replace(/,/g, '')) || 0;
            const signal = (row[idx.rsiAbove78] || '').toString().toUpperCase();
            const emaStatus = (row[idx.dEma200Status] || '').toString().toUpperCase();
            const rsiVal = parseFloat((row[idx.rsi] || '0').toString().replace(/,/g, '')) || 0;

            const matchesOthers = signal === 'Y' && emaStatus === 'ABOVE' && rsiVal < 60;
            if (matchesOthers) {
                counts[isMbVal] = (counts[isMbVal] || 0) + 1;
            }
        });

        console.log('Counts of IS_MB (Column BS) where other 3 conditions match:');
        Object.keys(counts).sort((a, b) => b - a).forEach(val => {
            console.log(`IS_MB = ${val}: ${counts[val]} stocks`);
        });

    } catch (err) {
        console.error('ERROR:', err.message);
    }
}

run();
