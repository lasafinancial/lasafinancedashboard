const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

function colToIdx(col) {
    let idx = 0;
    for (let i = 0; i < col.length; i++) {
        idx = idx * 26 + (col.toUpperCase().charCodeAt(i) - 64);
    }
    return idx - 1;
}

const localExcelPath = path.join(__dirname, 'datapulling', 'LASA-EOD-DATA.xlsx');

if (fs.existsSync(localExcelPath)) {
    const workbook = XLSX.readFile(localExcelPath);
    const sheetName = workbook.SheetNames[2] || 'current';
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const headers = rows[0];

    const colsToCheck = ['BS', 'FI', 'EP', 'K'];
    console.log('--- Column Header Check ---');
    colsToCheck.forEach(col => {
        const idx = colToIdx(col);
        console.log(`Column ${col} (Index ${idx}): "${headers[idx]}"`);
    });

    // Sample data for first few rows
    console.log('\n--- Sample Data (First 3 rows) ---');
    rows.slice(1, 4).forEach((row, i) => {
        console.log(`Row ${i + 1}:`);
        colsToCheck.forEach(col => {
            const idx = colToIdx(col);
            console.log(`  ${col}: ${row[idx]}`);
        });
    });
} else {
    console.log('Excel file not found at ' + localExcelPath);
}
