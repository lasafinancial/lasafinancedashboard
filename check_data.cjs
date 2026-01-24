const XLSX = require('xlsx');
const wb = XLSX.readFile('./datapulling/swing_backtest_2025.xlsx');
const data = XLSX.utils.sheet_to_json(wb.Sheets['DATA']);

function excelDateToJS(serial) {
  if (typeof serial !== 'number') return null;
  const utc_days = Math.floor(serial - 25569);
  return new Date(utc_days * 86400 * 1000);
}

// Get unique dates
const dates = [...new Set(data.map(r => {
  const d = r['DATE'];
  if (typeof d === 'number') return excelDateToJS(d).toISOString().split('T')[0];
  return null;
}).filter(Boolean))].sort();

console.log('Total rows:', data.length);
console.log('Date range:', dates[0], 'to', dates[dates.length-1]);
console.log('Total unique dates:', dates.length);
console.log('First 5 dates:', dates.slice(0,5));
console.log('Last 10 dates:', dates.slice(-10));

// Check sample row for Pattern
const sampleWithPattern = data.filter(r => r['PATTERN HIGH'] || r['PATTERN LOW']);
console.log('\nRows with Pattern data:', sampleWithPattern.length);
if (sampleWithPattern.length > 0) {
  console.log('Sample:', JSON.stringify(sampleWithPattern[0], null, 2));
}
