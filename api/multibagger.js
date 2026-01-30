import { google } from 'googleapis';

const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

function colToIdx(col) {
  let idx = 0;
  for (let i = 0; i < col.length; i++) {
    idx = idx * 26 + (col.toUpperCase().charCodeAt(i) - 64);
  }
  return idx - 1;
}

function getCredentials() {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable not set');
  }
  return JSON.parse(key);
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
      sector: colToIdx('B'),
      id: colToIdx('C'),
      cmp: colToIdx('E'),
      dRsiDiff: colToIdx('J'),
      rsi: colToIdx('K'),
      wRsi: colToIdx('Q'),
      peRatio: colToIdx('EL'),
      algoB: colToIdx('EM'),
      dEma200: colToIdx('EO'),
      dEma200Status: colToIdx('EP'),
      fiveYHigh: colToIdx('ER'),
      dEma63: colToIdx('ES'),
      rsiAbove78: colToIdx('FI')
    };

    const mbData = rows.slice(1).filter(row => {
      const signal = (row[idx.rsiAbove78] || '').toString().toUpperCase();
      return signal === 'Y';
    });

    const filtered = mbData.map(row => {
      const getNum = (val) => {
        if (val === undefined || val === null || val === '') return 0;
        return parseFloat(val.toString().replace(/,/g, '')) || 0;
      };

      return {
        sector: row[idx.sector] || 'N/A',
        id: row[idx.id] || 'N/A',
        stockName: row[idx.id] || 'N/A',
        cmp: getNum(row[idx.cmp]),
        rsi: getNum(row[idx.rsi]),
        dRsiDiff: getNum(row[idx.dRsiDiff]),
        wRsi: getNum(row[idx.wRsi]),
        dEma200: getNum(row[idx.dEma200]),
        dEma63: getNum(row[idx.dEma63]),
        peRatio: (row[idx.peRatio] || 'N/A').toString(),
        fiveYHigh: getNum(row[idx.fiveYHigh]),
        dEma200Status: (row[idx.dEma200Status] || 'N/A').toString(),
        algoB: (row[idx.algoB] || 'N/A').toString()
      };
    }).sort((a, b) => a.rsi - b.rsi);

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json(filtered);
  } catch (error) {
    console.error('Error in multibagger api:', error);
    return res.status(500).json({ error: 'Failed to fetch multibagger data', message: error.message });
  }
}
