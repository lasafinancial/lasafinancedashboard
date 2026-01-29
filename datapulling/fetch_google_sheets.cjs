const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const KEY_FILE_PATH = path.join(__dirname, '..', 'key-partition-484615-n5-67743fa5e288.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'data', 'processed');

const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';
const SWING_SHEET_ID = '1GEhcqN8roNR1F3601XNEDjQZ1V0OfSUtMxUPE2rcdNs';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function getOrdinalSuffix(day) {
  const d = parseInt(day);
  if (d > 3 && d < 21) return 'th';
  switch (d % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

function formatDate(dateInput) {
  if (!dateInput) return null;
  let date;
  if (dateInput instanceof Date) {
    date = dateInput;
  } else if (typeof dateInput === 'number') {
    const utc_days = Math.floor(dateInput - 25569);
    date = new Date(utc_days * 86400 * 1000);
  } else if (typeof dateInput === 'string') {
    date = new Date(dateInput);
  } else {
    return null;
  }
  if (isNaN(date.getTime())) return null;
  const day = date.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  return `${day}${getOrdinalSuffix(day)} ${month}`;
}

function parseSwingDate(dateStr) {
  if (!dateStr) return null;
  const monthMap = {
    'jan': 0, 'january': 0, 'feb': 1, 'february': 1, 'mar': 2, 'march': 2,
    'apr': 3, 'april': 3, 'may': 4, 'jun': 5, 'june': 5,
    'jul': 6, 'july': 6, 'aug': 7, 'august': 7, 'sep': 8, 'september': 8,
    'oct': 9, 'october': 9, 'nov': 10, 'november': 10, 'dec': 11, 'december': 11
  };
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length < 2) return null;
  
  let day, monthStr, year;
  if (!isNaN(parseInt(parts[0]))) {
    day = parseInt(parts[0]);
    monthStr = parts[1].toLowerCase();
    year = parts[2] ? parseInt(parts[2]) : new Date().getFullYear();
  } else {
    monthStr = parts[0].toLowerCase();
    day = parseInt(parts[1]);
    year = parts[2] ? parseInt(parts[2]) : new Date().getFullYear();
  }
  
  const month = monthMap[monthStr];
  if (month === undefined || isNaN(day)) return null;
  const date = new Date(year, month, day);
  return date;
}

function formatSwingDate(dateStr) {
  const date = parseSwingDate(dateStr);
  if (!date) return dateStr;
  const day = date.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day}${getOrdinalSuffix(day)} ${months[date.getMonth()]}`;
}

function formatSheetDate(sheetName) {
  const parts = sheetName.split('-');
  if (parts.length !== 3) return sheetName;
  const day = parseInt(parts[0]);
  const months = { 'JAN': 'Jan', 'FEB': 'Feb', 'MAR': 'Mar', 'APR': 'Apr', 'MAY': 'May', 'JUN': 'Jun', 'JUL': 'Jul', 'AUG': 'Aug', 'SEP': 'Sep', 'OCT': 'Oct', 'NOV': 'Nov', 'DEC': 'Dec' };
  const month = months[parts[1].toUpperCase()] || 'Jan';
  return `${day}${getOrdinalSuffix(day)} ${month}`;
}

function parseSheetDate(name) {
  const p = name.split('-');
  if (p.length !== 3) return new Date(0);
  const months = { 'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5, 'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11 };
  let year = parseInt(p[2]);
  if (year < 100) year += 2000;
  return new Date(year, months[p[1].toUpperCase()], parseInt(p[0]));
}

function rowsToObjects(rows) {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i] !== undefined ? row[i] : null;
    });
    return obj;
  });
}

async function fetchData() {
  console.log('Authenticating with Google Sheets API...');
  
  let auth;
  if (process.env.GOOGLE_CREDENTIALS) {
    console.log('Using credentials from environment variable...');
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
  } else if (fs.existsSync(KEY_FILE_PATH)) {
    console.log('Using local key file...');
    auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE_PATH,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
  } else {
    throw new Error('No Google credentials found (neither GOOGLE_CREDENTIALS env var nor key-partition-*.json file)');
  }
  
  const sheets = google.sheets({ version: 'v4', auth });
  
  console.log('Fetching EOD sheet metadata...');
  const eodMeta = await sheets.spreadsheets.get({ spreadsheetId: EOD_SHEET_ID });
  const allSheets = eodMeta.data.sheets.map(s => s.properties.title);
  
    console.log('Fetching all data from lasa-master...');
    const lasaMasterRes = await sheets.spreadsheets.values.get({
      spreadsheetId: EOD_SHEET_ID,
      range: 'lasa-master!A:FJ',
    });
    const lasaMasterData = rowsToObjects(lasaMasterRes.data.values);
    
    // Get latest date for Market Mood and latest status
    const allDates = [...new Set(lasaMasterData.map(r => r['DATE']).filter(Boolean))];
    const sortedDates = allDates.sort((a, b) => new Date(b) - new Date(a));
    const latestDate = sortedDates[0];
    console.log(`Latest date in lasa-master: ${latestDate}`);

    console.log('Fetching Top Movers and Market Mood from current tab...');
    try {
      const currentRes = await sheets.spreadsheets.values.get({
        spreadsheetId: EOD_SHEET_ID,
        range: "'current'!A1:FJ",
      });
      const currentData = rowsToObjects(currentRes.data.values);
      
      // Calculate Market Mood based on new logic: top 470 rows, Large/Mid cap, Status BG (STATUS)
      const moodStocks = currentData.slice(0, 470).filter(row => {
        const group = (row['GROUP'] || '').toString().toUpperCase();
        return group === 'LARGECAP' || group === 'MIDCAP';
      });

      let bullCount = 0, bearCount = 0, neutCount = 0;
      moodStocks.forEach(row => {
        const status = (row['STATUS'] || '').toString().toUpperCase();
        if (status === 'BULLISH') bullCount++;
        else if (status === 'BEARISH') bearCount++;
        else neutCount++;
      });

      const totalMoodStocks = moodStocks.length;
      const marketMood = {
        bullish: totalMoodStocks > 0 ? (bullCount / totalMoodStocks) * 100 : 0,
        bearish: totalMoodStocks > 0 ? (bearCount / totalMoodStocks) * 100 : 0,
        neutral: totalMoodStocks > 0 ? (neutCount / totalMoodStocks) * 100 : 0,
        date: formatDate(new Date(latestDate))
      };
      
      fs.writeFileSync(path.join(OUTPUT_DIR, 'market_mood.json'), JSON.stringify(marketMood, null, 2));
      console.log(`Market Mood saved: ${marketMood.bullish.toFixed(1)}% Bullish (calculated from ${totalMoodStocks} stocks)`);

      const stocks = currentData
        .filter(row => {
          if (!row['STOCK_NAME'] || row['CHANGE_PERCENT'] === undefined || row['CHANGE_PERCENT'] === '') return false;
          const group = (row['GROUP'] || '').toString().toUpperCase();
          return group === 'LARGECAP' || group === 'MIDCAP';
        })
        .map(row => ({
          id: row['ID'] || row['STOCK_NAME'],
          stockName: row['STOCK_NAME'],
          changePercent: parseFloat((row['CHANGE_PERCENT'] || '0').toString().replace('%', '').replace(/,/g, '')) || 0,
          closePrice: parseFloat((row['CLOSE_PRICE'] || '0').toString().replace(/,/g, '')) || 0
        }))
        .filter(s => !isNaN(s.changePercent) && !isNaN(s.closePrice));
      
      const sortedByChange = [...stocks].sort((a, b) => b.changePercent - a.changePercent);
      
      const topGainers = sortedByChange.filter(s => s.changePercent > 0).slice(0, 10);
      const topLosers = sortedByChange.filter(s => s.changePercent < 0).slice(-10).reverse();
      
      const topMovers = { topGainers, topLosers };
      fs.writeFileSync(path.join(OUTPUT_DIR, 'top_movers.json'), JSON.stringify(topMovers, null, 2));
      console.log(`Top Movers saved. ${topGainers.length} gainers, ${topLosers.length} losers.`);
    } catch (err) {
      console.warn('Could not fetch top movers or market mood from current tab:', err.message);
    }
  
  console.log('\n=== Data fetch complete! ===');
}

fetchData().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
