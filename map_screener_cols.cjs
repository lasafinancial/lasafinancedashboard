const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

function getCredentials() {
    const keyPath = path.join(__dirname, 'secerate_googlekey', 'key-partition-484615-n5-3411b9e54bd0.json');
    if (fs.existsSync(keyPath)) {
        return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    }
    return null;
}

async function mapColumns() {
    const credentials = getCredentials();
    if (!credentials) return;
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] });
    const sheets = google.sheets({ version: 'v4', auth });
    const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

    try {
        const res = await sheets.spreadsheets.values.get({ spreadsheetId: EOD_SHEET_ID, range: 'lasa-master!A1:FJ1' });
        const headers = res.data.values[0];

        const targets = [
            { col: 'BG', name: 'STATUS' },
            { col: 'S', name: 'GROUP' },
            { col: 'EP', name: 'D-EMA-200-Status' },
            { col: 'C', name: 'ID' },
            { col: 'E', name: 'CLOSE_PRICE' },
            { col: 'DI', name: 'RESISTANCE' },
            { col: 'DH', name: 'SUPPORT' },
            { col: 'DU', name: 'D_BREAKOUT_PRICE' },
            { col: 'EQ', name: 'ML_TARGET_PERCENT' },
            { col: 'EM', name: 'ALGO_B' },
            { col: 'FI', name: 'ALGO_FG_PERCENT' }, // guessing
            { col: 'FJ', name: 'W_PROJECTION_2' }, // guessing
        ];

        function colToIdx(col) {
            let idx = 0;
            for (let i = 0; i < col.length; i++) {
                idx = idx * 26 + (col.toUpperCase().charCodeAt(i) - 64);
            }
            return idx - 1;
        }

        console.log('--- Column Mapping Check ---');
        targets.forEach(t => {
            const idx = colToIdx(t.col);
            console.log(`${t.col} (${idx}): Target=${t.name} -> Header Found="${headers[idx]}"`);
        });

    } catch (err) {
        console.error(err);
    }
}
mapColumns();
