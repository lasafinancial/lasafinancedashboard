const admin = require('firebase-admin');
const fs = require('fs');

const cleanBase64 = fs.readFileSync('scratch/clean_base64.txt', 'utf-8').trim();

const decoded = Buffer.from(cleanBase64, 'base64').toString('utf-8');
const creds = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(creds),
  projectId: 'lasa-dashboard-2f21d'
});

async function run() {
  const db = admin.firestore();
  console.log('Fetching FCM tokens from Firestore...');
  const snapshot = await db.collection('fcm_tokens').get();
  
  const tokensSet = new Set();
  snapshot.forEach(doc => {
    const data = doc.data() || {};
    const candidate = data.token || data.fcmToken || data.fcm_token || doc.id;
    if (candidate && typeof candidate === 'string' && candidate.length > 20) {
      tokensSet.add(candidate.trim());
    }
  });

  const tokens = Array.from(tokensSet);
  console.log(`Found ${tokens.length} recipient tokens in Firestore:`, tokens);

  for (const token of tokens) {
    try {
      console.log('Sending test FCM push to token:', token.slice(0, 25) + '...');
      const message = {
        token,
        notification: {
          title: 'Lasa Market Update Test',
          body: 'This is a live push notification test from Lasa Research Services!'
        },
        webpush: {
          headers: { Urgency: 'high' },
          notification: {
            title: 'Lasa Market Update Test',
            body: 'This is a live push notification test from Lasa Research Services!',
            icon: '/complogo.png',
            badge: '/complogo.png',
            requireInteraction: true
          }
        }
      };
      const resp = await admin.messaging().send(message);
      console.log('SUCCESS! Sent message ID:', resp);
    } catch (err) {
      console.log('Error sending to token:', err.code || err.message);
    }
  }
}

run().catch(console.error);
