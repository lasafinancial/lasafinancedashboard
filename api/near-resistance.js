import { google } from 'googleapis';
import { getGoogleCredentialsHelper } from './credentialsHelper.js';

const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

let cachedNearResistance = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour during market hours (0 outside)

function isMarketOpen() {
    const now = new Date();
    const istDateString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const istDate = new Date(istDateString);
    const day = istDate.getDay(); 
    const timeInMinutes = istDate.getHours() * 60 + istDate.getMinutes();
    return (day >= 1 && day <= 5) && (timeInMinutes >= 9 * 60 + 15 && timeInMinutes <= 15 * 60 + 30);
}

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

    const marketOpen = isMarketOpen();
    const now = Date.now();

    if (marketOpen) {
        setCacheTier(res, 'hourly');
    } else {
        setCacheTier(res, 'daily');
    }

    if (cachedNearResistance && cachedNearResistance.length > 0 && (!marketOpen || (now - lastFetchTime < CACHE_DURATION))) {
        return res.status(200).json(cachedNearResistance);
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
            if (cachedNearResistance && cachedNearResistance.length > 0) {
                return res.status(200).json(cachedNearResistance);
            }
            setNoStore(res);
            return res.status(503).json({ error: 'Upstream data unavailable', message: 'No screener data in sheet' });
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

        cachedNearResistance = filtered;
        lastFetchTime = now;

        return res.status(200).json(filtered);
    } catch (error) {
        console.error('Error in near-resistance api:', error);
        if (cachedNearResistance && cachedNearResistance.length > 0) {
            return res.status(200).json(cachedNearResistance);
        }
        setNoStore(res);
        if (isQuotaError(error)) {
            res.setHeader('Retry-After', '60');
            return res.status(429).json({ error: 'Google Sheets quota exceeded', message: error.message });
        }
        return res.status(500).json({ error: 'Failed to fetch screener data', message: error.message });
    }
}
