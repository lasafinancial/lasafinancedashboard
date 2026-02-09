import admin from 'firebase-admin';

// Reusing the same initialization logic as other endpoints
if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : null;

    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
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
    const adminSecret = process.env.ADMIN_SECRET || 'lasa_admin_secret_123'; // Fallback for testing if env not set

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
                const message = {
                    token,
                    notification: {
                        title,
                        body,
                        image: image || '/testingnoti.png' // Add here too
                    },
                    data: image ? { image } : {},
                    webpush: {
                        notification: {
                            icon: '/complogo.png',
                            badge: '/complogo.png',
                            image: image || '/testingnoti.png',
                            requireInteraction: true,
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
