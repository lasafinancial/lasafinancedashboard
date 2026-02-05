// Helper script to generate Base64 encoded credentials for Vercel
// Run this script to get the Base64 strings you need to add to Vercel environment variables

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('VERCEL ENVIRONMENT VARIABLES - BASE64 GENERATOR');
console.log('='.repeat(80));
console.log();

// Firebase Service Account
const firebasePath = path.join(__dirname, 'secerate_googlekey', 'key-partition-484615-n5-67743fa5e288.json');
let firebaseBase64 = null;

if (fs.existsSync(firebasePath)) {
    const firebaseJson = fs.readFileSync(firebasePath, 'utf-8');
    firebaseBase64 = Buffer.from(firebaseJson).toString('base64');

    console.log('✅ Firebase Service Account Key Found');
    console.log('   File:', firebasePath);
    console.log();
    console.log('📋 FIREBASE_SERVICE_ACCOUNT_KEY_BASE64:');
    console.log('-'.repeat(80));
    console.log(firebaseBase64);
    console.log('-'.repeat(80));
    console.log();

    // Save to file for easy copying
    fs.writeFileSync('firebase-base64.txt', firebaseBase64);
    console.log('💾 Saved to: firebase-base64.txt');
    console.log();
} else {
    console.log('❌ Firebase Service Account Key NOT FOUND');
    console.log('   Expected at:', firebasePath);
    console.log();
}

// Google Sheets Service Account (same file)
const googlePath = path.join(__dirname, 'key-partition-484615-n5-67743fa5e288.json');
let googleBase64 = null;

if (fs.existsSync(googlePath)) {
    const googleJson = fs.readFileSync(googlePath, 'utf-8');
    googleBase64 = Buffer.from(googleJson).toString('base64');

    console.log('✅ Google Sheets Service Account Key Found');
    console.log('   File:', googlePath);
    console.log();
    console.log('📋 GOOGLE_SERVICE_ACCOUNT_KEY_BASE64:');
    console.log('-'.repeat(80));
    console.log(googleBase64);
    console.log('-'.repeat(80));
    console.log();

    // Save to file for easy copying
    fs.writeFileSync('google-base64.txt', googleBase64);
    console.log('💾 Saved to: google-base64.txt');
    console.log();
} else {
    console.log('❌ Google Sheets Service Account Key NOT FOUND');
    console.log('   Expected at:', googlePath);
    console.log();
}

console.log('='.repeat(80));
console.log('NEXT STEPS:');
console.log('='.repeat(80));
console.log();
console.log('1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
console.log();
console.log('2. Add these TWO environment variables:');
console.log();
console.log('   Variable Name: FIREBASE_SERVICE_ACCOUNT_KEY_BASE64');
console.log('   Value: (copy from firebase-base64.txt or above)');
console.log('   Environments: Production, Preview, Development');
console.log();
console.log('   Variable Name: GOOGLE_SERVICE_ACCOUNT_KEY_BASE64');
console.log('   Value: (copy from google-base64.txt or above)');
console.log('   Environments: Production, Preview, Development');
console.log();
console.log('3. Redeploy your Vercel project');
console.log();
console.log('4. Test the notification flow');
console.log();
console.log('='.repeat(80));
