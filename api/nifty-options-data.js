
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
        console.log('[NIFTY-OPTICS] Diagnostic Info:');
        console.log('process.cwd():', process.cwd());
        console.log('__dirname:', __dirname);

        // List potential locations
        const locations = [
            path.join(process.cwd(), 'datapulling', 'NiftyAnalysis.xlsx'),
            path.join(process.cwd(), '..', 'datapulling', 'NiftyAnalysis.xlsx'),
            path.join(__dirname, '..', 'datapulling', 'NiftyAnalysis.xlsx'),
            path.join(__dirname, 'datapulling', 'NiftyAnalysis.xlsx')
        ];

        let excelPath = null;
        for (const loc of locations) {
            if (fs.existsSync(loc)) {
                excelPath = loc;
                console.log('[NIFTY-OPTICS] Found file at:', loc);
                break;
            }
        }

        if (!excelPath) {
            console.error('[NIFTY-OPTICS] NiftyAnalysis.xlsx NOT found in any known locations.');
            // Let's at least see what IS in the current directory
            try {
                console.log('CWD contents:', fs.readdirSync(process.cwd()));
            } catch (e) { }
            return res.status(404).json({ error: 'NiftyAnalysis.xlsx not found in deployment' });
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
        console.error('[NIFTY-OPTICS] Error reading NiftyAnalysis.xlsx:', error);
        res.status(500).json({ error: 'Failed to read Nifty Options data', details: error.message });
    }
};
