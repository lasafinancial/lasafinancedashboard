const admin = require('firebase-admin');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf-8');
const line = env.split('\n').find(l => l.startsWith('FIREBASE_SERVICE_ACCOUNT_KEY='));
const val = line.substring('FIREBASE_SERVICE_ACCOUNT_KEY='.length).trim();
const creds = JSON.parse(val);

// Ensure proper newline formatting
creds.private_key = creds.private_key.replace(/\\n/g, '\n');

// Generate clean Base64
const cleanBase64 = Buffer.from(JSON.stringify(creds)).toString('base64');
fs.writeFileSync('scratch/clean_base64.txt', cleanBase64);

console.log('Clean Base64 written to scratch/clean_base64.txt, length:', cleanBase64.length);

// Verify decoding
const decoded = Buffer.from(cleanBase64, 'base64').toString('utf-8');
const parsedCreds = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(parsedCreds),
  projectId: 'lasa-dashboard-2f21d'
});

admin.firestore().collection('fcm_tokens').get().then(snapshot => {
  console.log('100% VERIFIED SUCCESS! Token count in Firestore:', snapshot.size);
  snapshot.forEach(doc => console.log('Doc ID:', doc.id, 'Data:', doc.data()));
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
