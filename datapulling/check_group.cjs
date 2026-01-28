const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'secerate_googlekey', 'key-partition-484615-n5-52acc9edc675.json'), 'utf8'));
const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] });
const sheets = google.sheets({ version: 'v4', auth });

async function check() {
  // Check current sheet headers
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I',
    range: 'current!A1:Z2'
  });
  console.log('Current sheet headers A-Z:', res.data.values[0]);
  
  // Check column S specifically
  const res2 = await sheets.spreadsheets.values.get({
    spreadsheetId: '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I',
    range: 'current!S1:S20'
  });
  console.log('\nColumn S (GROUP) first 20 values:', res2.data.values);
  
  // Get unique GROUP values
  const res3 = await sheets.spreadsheets.values.get({
    spreadsheetId: '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I',
    range: 'current!S:S'
  });
  const allGroups = res3.data.values.flat().filter(Boolean);
  const uniqueGroups = [...new Set(allGroups)];
  console.log('\nUnique GROUP values:', uniqueGroups);
  
  // Count by group
  const groupCounts = {};
  allGroups.forEach(g => {
    groupCounts[g] = (groupCounts[g] || 0) + 1;
  });
  console.log('\nGroup counts:', groupCounts);
}

check().catch(console.error);
