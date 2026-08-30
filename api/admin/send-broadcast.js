import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Reusing the same initialization logic as other endpoints
function getFirebaseCredentials() {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
    
    if (base64Key) {
        try {
            const decoded = Buffer.from(base64Key, 'base64').toString('utf-8');
            const creds = JSON.parse(decoded);
            if (creds?.private_key) creds.private_key = creds.private_key.replace(/\\n/g, '\n').trim();
            return creds;
        } catch (e) {
            console.error('Base64 parse error:', e.message);
        }
    }

    if (key) {
        try {
            let cleanKey = key.trim();
            if ((cleanKey.startsWith("'") && cleanKey.endsWith("'")) || (cleanKey.startsWith('"') && cleanKey.endsWith('"'))) {
                cleanKey = cleanKey.slice(1, -1).trim();
            }
            const creds = JSON.parse(cleanKey);
            if (creds?.private_key) creds.private_key = creds.private_key.replace(/\\n/g, '\n').trim();
            return creds;
        } catch (e) {
            console.error('Raw key parse error:', e.message);
        }
    }

    // Disk fallback for Vercel bundled file
    try {
        const filePath = path.join(process.cwd(), 'firebase-service-account.json');
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const creds = JSON.parse(content);
            if (creds?.private_key) creds.private_key = creds.private_key.replace(/\\n/g, '\n').trim();
            return creds;
        }
    } catch (e) {
        console.error('File fallback parse error:', e.message);
    }

    return null;
}

if (!admin.apps.length) {
    const serviceAccount = getFirebaseCredentials();
    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: 'lasa-dashboard-2f21d',
        });
    } else {
        admin.initializeApp({
            projectId: 'lasa-dashboard-2f21d',
        });
    }
}

export default async function handler(req, res) {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { title, body, image } = req.body;
    const authHeader = req.headers.authorization;
    const adminSecret = process.env.ADMIN_SECRET || 'lasa123'; // Matches the frontend password gateway

    // Simple Admin Auth Check
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
        return res.status(401).json({ error: 'Unauthorized: Invalid Admin Secret' });
    }

    if (!title || !body) {
        return res.status(400).json({ error: 'Title and Body are required' });
    }

    try {
        const db = admin.firestore();
        const tokensSnapshot = await db.collection('fcm_tokens').get();

        const tokens = [];
        tokensSnapshot.forEach(doc => {
            if (doc.data().token) tokens.push(doc.data().token);
        });

        if (tokens.length === 0) {
            return res.status(200).json({ successCount: 0, failedCount: 0, message: 'No users subscribed.' });
        }

        let successCount = 0;
        let failedCount = 0;
        const invalidTokens = [];

        // Send to each token
        for (const token of tokens) {
            try {
                const notifImage = image || '/testingnoti.png';
                const message = {
                    token,
                    notification: {
                        title,
                        body,
                        image: notifImage
                    },
                    data: {
                        title,
                        body,
                        image: notifImage,
                        url: '/'
                    },
                    webpush: {
                        headers: {
                            Urgency: 'high'
                        },
                        notification: {
                            title,
                            body,
                            icon: '/complogo.png',
                            badge: '/complogo.png',
                            image: notifImage,
                            requireInteraction: true,
                        },
                        fcmOptions: {
                            link: '/'
                        }
                    }
                };

                await admin.messaging().send(message);
                successCount++;
            } catch (error) {
                failedCount++;
                if (error.code === 'messaging/registration-token-not-registered' ||
                    error.code === 'messaging/invalid-registration-token') {
                    invalidTokens.push(token);
                }
            }
        }

        // Cleanup invalid tokens
        if (invalidTokens.length > 0) {
            const batch = db.batch();
            invalidTokens.forEach(token => {
                batch.delete(db.collection('fcm_tokens').doc(token));
            });
            await batch.commit();
        }

        return res.status(200).json({
            success: true,
            successCount,
            failedCount,
            sentTo: tokens.length
        });

    } catch (error) {
        console.error('Broadcast Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
