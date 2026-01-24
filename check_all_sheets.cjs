const XLSX = require('xlsx');
const path = require('path');

const EOD_FILE = path.join(__dirname, 'datapulling', 'LASA-EOD-DATA.xlsx');
const SWING_FILE = path.join(__dirname, 'datapulling', 'swing_backtest_2025.xlsx');

// Check EOD file sheets
console.log('=== LASA-EOD-DATA.xlsx ===');
const eodWb = XLSX.readFile(EOD_FILE, { bookSheets: true });
console.log('Total sheets:', eodWb.SheetNames.length);
console.log('All sheets:', eodWb.SheetNames);

// Check SWING file sheets
console.log('\n=== swing_backtest_2025.xlsx ===');
const swingWb = XLSX.readFile(SWING_FILE, { bookSheets: true });
console.log('Total sheets:', swingWb.SheetNames.length);
console.log('All sheets:', swingWb.SheetNames);

// Check DATA sheet in swing file for latest dates
console.log('\n=== DATA sheet date range ===');
const swingFull = XLSX.readFile(SWING_FILE);
const dataSheet = swingFull.Sheets['DATA'];
const rows = XLSX.utils.sheet_to_json(dataSheet);

function excelDateToJS(serial) {
  if (typeof serial !== 'number') return null;
  const utc_days = Math.floor(serial - 25569);
  return new Date(utc_days * 86400 * 1000);
}

const dates = rows.map(r => {
  const d = r['DATE'];
  if (typeof d === 'number') return excelDateToJS(d);
  return null;
}).filter(Boolean);

dates.sort((a, b) => b - a);
console.log('Latest 10 dates in DATA sheet:');
dates.slice(0, 10).forEach(d => console.log('  ', d.toDateString()));
