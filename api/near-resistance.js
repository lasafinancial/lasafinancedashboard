import { google } from 'googleapis';
import { getGoogleCredentialsHelper } from './credentialsHelper.js';

const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

function colToIdx(col) {
    let idx = 0;
    for (let i = 0; i < col.length; i++) {
        idx = idx * 26 + (col.toUpperCase().charCodeAt(i) - 64);
    }
    return idx - 1;
}

function getCredentials() {
    return getGoogleCredentialsHelper();
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
            spreadsheetId: EOD_SHEET_ID,
            range: "'current'!A:FJ",
        });

        const rows = response.data.values;
        if (!rows || rows.length < 2) {
            return res.status(200).json([]);
        }

        const idx = {
            status: colToIdx('BG'),
            group: colToIdx('S'),
            ema200Status: colToIdx('EP'),
            id: colToIdx('C'),
            closePrice: colToIdx('E'),
            resistance: colToIdx('DI'),
            support: colToIdx('DH'),
            breakout: colToIdx('DU'),
            mlTarget: colToIdx('EQ'),
            algoB: colToIdx('EM'),
            algFgPercent: colToIdx('FI'),
            wProjection2: colToIdx('FJ')
        };

        const filtered = rows.slice(1).filter(row => {
            const status = (row[idx.status] || '').toString().toUpperCase();
            const group = (row[idx.group] || '').toString().toUpperCase();
            return status === 'BULLISH' && (group === 'LARGECAP' || group === 'MIDCAP');
        }).map(row => {
            const getNum = (val) => {
                if (val === undefined || val === null || val === '') return 0;
                const strVal = val.toString().replace(/,/g, '');
                if (strVal.includes('#')) return 0;
                return parseFloat(strVal) || 0;
            };

            return {
                dEma200Status: (row[idx.ema200Status] || '').toString(),
                id: (row[idx.id] || '').toString(),
                closePrice: getNum(row[idx.closePrice]),
                resistance: getNum(row[idx.resistance]),
                support: getNum(row[idx.support]),
                dBreakoutPrice: getNum(row[idx.breakout]),
                mlTargetPercent: getNum(row[idx.mlTarget]),
                algoB: getNum(row[idx.algoB]),
                algFgPercent: getNum(row[idx.algFgPercent]),
                wProjection2: getNum(row[idx.wProjection2]),
                wProjection3: 0
            };
        });

        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
        return res.status(200).json(filtered);
    } catch (error) {
        console.error('Error in near-resistance api:', error);
        return res.status(500).json({ error: 'Failed to fetch screener data', message: error.message });
    }
}
