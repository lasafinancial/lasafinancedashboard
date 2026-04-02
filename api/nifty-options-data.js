
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    // Add CORS headers for Vercel
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // In Vercel, the file should be in the root-relative path
        const excelPath = path.join(process.cwd(), 'datapulling', 'NiftyAnalysis.xlsx');

        if (!fs.existsSync(excelPath)) {
            console.error('NiftyAnalysis.xlsx NOT found at:', excelPath);
            return res.status(404).json({ error: 'NiftyAnalysis.xlsx not found' });
        }

        const workbook = XLSX.readFile(excelPath);
        const sheetName = 'Nifty-Options';

        if (!workbook.SheetNames.includes(sheetName)) {
            return res.status(404).json({ error: 'Sheet Nifty-Options not found in Excel file' });
        }

        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });

        res.status(200).json(data);
    } catch (error) {
        console.error('Error reading NiftyAnalysis.xlsx:', error);
        res.status(500).json({ error: 'Failed to read Nifty Options data' });
    }
};
