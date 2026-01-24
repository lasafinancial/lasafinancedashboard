const { google } = require('googleapis');
const path = require('path');
const KEY_FILE = path.join(__dirname, '..', 'key-partition-484615-n5-67743fa5e288.json');
const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });
  const sheets = google.sheets({ version: 'v4', auth });
  
  console.log('Fetching Market Position Structure data from current tab...\n');
  
  const res = await sheets.spreadsheets.values.get({ 
    spreadsheetId: EOD_SHEET_ID, 
    range: "'current'!A1:DZ" 
  });
  
  const headers = res.data.values[0];
  const rows = res.data.values.slice(1);
  
  const closePriceIdx = headers.indexOf('CLOSE_PRICE');
  const mlRecomIdx = headers.indexOf('ML-RECOM');
  const avgPrice20dIdx = headers.indexOf('AVG_PRICE_20D');
  const rsiIdx = headers.indexOf('RSI');
  const supportIdx = headers.indexOf('SUPPORT');
  const resistanceIdx = headers.indexOf('RESISTANCE');
  const heikenSignalIdx = headers.indexOf('HIEKEN_LAST_SIGNAL');
  const trendChangeIdx = headers.indexOf('TREND_CHANGE_20D');
  
  console.log('Column indices:', {
    closePriceIdx, mlRecomIdx, avgPrice20dIdx, rsiIdx, supportIdx, resistanceIdx, heikenSignalIdx, trendChangeIdx
  });
  
  let mlBuy = 0, mlSell = 0, mlIgnore = 0;
  let balanceAbove = 0, balanceBelow = 0;
  let rsiAbove = 0, rsiBelow = 0;
  let atSupport = 0, atResistance = 0, srNeutral = 0;
  let revUp = 0, revDown = 0, revNeutral = 0;
  let validCount = 0;
  
  rows.forEach(row => {
    const closePrice = parseFloat((row[closePriceIdx] || '0').toString().replace(/,/g, ''));
    if (!closePrice || closePrice === 0) return;
    validCount++;
    
    const mlRecom = (row[mlRecomIdx] || '').toString().toUpperCase();
    if (mlRecom === 'BUY') mlBuy++;
    else if (mlRecom === 'SELL') mlSell++;
    else mlIgnore++;
    
    const avgPrice20d = parseFloat((row[avgPrice20dIdx] || '0').toString().replace(/,/g, ''));
    if (avgPrice20d > 0) {
      if (closePrice > avgPrice20d) balanceAbove++;
      else balanceBelow++;
    }
    
    const rsi = parseFloat(row[rsiIdx] || '50');
    if (rsi > 50) rsiAbove++;
    else rsiBelow++;
    
    const support = parseFloat((row[supportIdx] || '0').toString().replace(/,/g, ''));
    const resistance = parseFloat((row[resistanceIdx] || '0').toString().replace(/,/g, ''));
    if (support > 0 && resistance > 0 && resistance > support) {
      const range = resistance - support;
      const distFromSupport = closePrice - support;
      const distFromResistance = resistance - closePrice;
      const supportZone = range * 0.2;
      const resistanceZone = range * 0.2;
      
      if (distFromSupport <= supportZone) atSupport++;
      else if (distFromResistance <= resistanceZone) atResistance++;
      else srNeutral++;
    } else {
      srNeutral++;
    }
    
    const heikenSignal = (row[heikenSignalIdx] || '').toString().toUpperCase();
    const trendChange = (row[trendChangeIdx] || '').toString().toUpperCase();
    
    if (heikenSignal.includes('BUY') || heikenSignal.includes('LONG') || 
        trendChange.includes('UP') || trendChange.includes('BULLISH')) {
      revUp++;
    } else if (heikenSignal.includes('SELL') || heikenSignal.includes('SHORT') || 
               trendChange.includes('DOWN') || trendChange.includes('BEARISH')) {
      revDown++;
    } else {
      revNeutral++;
    }
  });
  
  const total = validCount || 1;
  
  console.log('\n=== MARKET POSITION STRUCTURE DATA ===\n');
  console.log(`Total valid stocks: ${validCount}\n`);
  
  console.log('MODEL (ML-RECOM):');
  console.log(`  ML_UP (BUY): ${Math.round((mlBuy / total) * 100)}% (${mlBuy})`);
  console.log(`  ML_DOWN (SELL): ${Math.round((mlSell / total) * 100)}% (${mlSell})`);
  console.log(`  IGNORE: ${Math.round((mlIgnore / total) * 100)}% (${mlIgnore})`);
  
  console.log('\nBALANCE (Price vs 20D Avg):');
  console.log(`  Avg-Above: ${Math.round((balanceAbove / total) * 100)}% (${balanceAbove})`);
  console.log(`  Avg-Below: ${Math.round((balanceBelow / total) * 100)}% (${balanceBelow})`);
  
  console.log('\nMOMENTUM (RSI > 50):');
  console.log(`  100-RSI (Bullish): ${Math.round((rsiAbove / total) * 100)}% (${rsiAbove})`);
  console.log(`  RSI (Bearish): ${Math.round((rsiBelow / total) * 100)}% (${rsiBelow})`);
  
  console.log('\nS/R (Support/Resistance Zones):');
  console.log(`  Support Zone: ${Math.round((atSupport / total) * 100)}% (${atSupport})`);
  console.log(`  Resistance Zone: ${Math.round((atResistance / total) * 100)}% (${atResistance})`);
  console.log(`  Neutral: ${Math.round((srNeutral / total) * 100)}% (${srNeutral})`);
  
  console.log('\nREVERSAL (Heiken + Trend Change):');
  console.log(`  Reversal-Up: ${Math.round((revUp / total) * 100)}% (${revUp})`);
  console.log(`  Reversal-Down: ${Math.round((revDown / total) * 100)}% (${revDown})`);
  console.log(`  Neutral: ${Math.round((revNeutral / total) * 100)}% (${revNeutral})`);
}

main().catch(console.error);
