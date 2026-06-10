import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

async function check() {
  let keyContent = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyContent) {
    const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
    envFile.split('\n').forEach(line => {
      const [key, ...val] = line.split('=');
      if (key && val.length > 0) {
        process.env[key.trim()] = val.join('=').trim().replace(/^\"|\"$/g, '').replace(/\\n/g, '\n');
      }
    });
    keyContent = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  }
  
  if (!keyContent) {
    const localKeyPath = path.join(process.cwd(), 'secerate_googlekey', 'key-partition-484615-n5-3411b9e54bd0.json');
    if (fs.existsSync(localKeyPath)) {
      keyContent = fs.readFileSync(localKeyPath, 'utf8');
    }
  }

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(keyContent),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  try {
    const resMaster = await sheets.spreadsheets.values.get({
      spreadsheetId: '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I',
      range: "'lasa-master'!A1:FZ1"
    });
    let headersMaster = resMaster.data.values ? resMaster.data.values[0] : [];
    let obvMaster = headersMaster.findIndex(h => h && h.toUpperCase().includes('OBV'));
    console.log('lasa-master OBV index:', obvMaster, obvMaster !== -1 ? headersMaster[obvMaster] : '');

    const resCurrent = await sheets.spreadsheets.values.get({
      spreadsheetId: '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I',
      range: "'current'!A1:FZ1"
    });
    let headersCurrent = resCurrent.data.values ? resCurrent.data.values[0] : [];
    let obvCurrent = headersCurrent.findIndex(h => h && h.toUpperCase().includes('OBV'));
    console.log('current OBV index:', obvCurrent, obvCurrent !== -1 ? headersCurrent[obvCurrent] : '');

  } catch (e) {
    console.error('Error:', e.message);
  }
}
check().catch(console.error);
