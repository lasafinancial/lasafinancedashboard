// API endpoint to verify Email OTP and return a Firebase custom token
import admin from 'firebase-admin';

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

const db = admin.firestore();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required' });
        }

        const otpRef = db.collection('email_otps').doc(email);
        const doc = await otpRef.get();

        if (!doc.exists) {
            return res.status(400).json({ error: 'No OTP found for this email' });
        }

        const data = doc.data();
        const now = new Date();

        if (data.otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        if (data.expiresAt.toDate() < now) {
            return res.status(400).json({ error: 'OTP has expired' });
        }

        // OTP is valid! Delete it so it can't be reused
        await otpRef.delete();

        // Create or find user in Firebase Auth
        let userRecord;
        try {
            userRecord = await admin.auth().getUserByEmail(email);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                userRecord = await admin.auth().createUser({
                    email,
                    emailVerified: true,
                    displayName: email.split('@')[0],
                });
            } else {
                throw error;
            }
        }

        // Generate Custom Token
        const customToken = await admin.auth().createCustomToken(userRecord.uid);

        return res.status(200).json({
            success: true,
            customToken
        });

    } catch (error) {
        console.error('Error verifying email OTP:', error);
        return res.status(500).json({ error: 'Verification failed', details: error.message });
    }
}
