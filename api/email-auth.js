
// api/email-auth.js — Consolidated Email OTP Handler (Send & Verify)
import admin from 'firebase-admin';

// ── Firebase Admin Init ──────────────────────────────────────────────────────
function getFirebaseCredentials() {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
    if (!key && !base64Key) return null;
    try {
        let credentials;
        if (base64Key) {
            const decoded = Buffer.from(base64Key, 'base64').toString('utf-8');
            credentials = JSON.parse(decoded);
        } else {
            let cleanKey = key.trim();
            if ((cleanKey.startsWith("'") && cleanKey.endsWith("'")) || (cleanKey.startsWith('"') && cleanKey.endsWith('"'))) {
                cleanKey = cleanKey.slice(1, -1).trim();
            }
            credentials = JSON.parse(cleanKey);
        }
        if (credentials?.private_key) {
            credentials.private_key = credentials.private_key.replace(/\\n/g, '\n').trim();
        }
        return credentials;
    } catch (e) {
        console.error('Firebase Auth Parse Error:', e.message);
        return null;
    }
}

if (!admin.apps.length) {
    const serviceAccount = getFirebaseCredentials();
    admin.initializeApp({
        credential: serviceAccount ? admin.credential.cert(serviceAccount) : admin.credential.applicationDefault(),
        projectId: 'lasa-dashboard-2f21d',
    });
}

const db = admin.firestore();

// ── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, otp, type } = req.body; // type: 'send' or 'verify'

    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email is required' });
    }

    try {
        // --- CASE 1: SEND EMAIL OTP ---
        if (type === 'send') {
            const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

            await db.collection('email_otps').doc(email).set({
                otp: generatedOtp,
                expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log(`[email-auth] OTP for ${email}: ${generatedOtp}`);

            return res.status(200).json({
                success: true,
                message: 'OTP generated successfully',
                debugOtp: process.env.NODE_ENV === 'development' ? generatedOtp : null
            });
        }

        // --- CASE 2: VERIFY EMAIL OTP ---
        if (type === 'verify') {
            if (!otp) return res.status(400).json({ error: 'OTP is required' });

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

            // Valid! Delete and create custom token
            await otpRef.delete();

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

            const customToken = await admin.auth().createCustomToken(userRecord.uid);
            return res.status(200).json({ success: true, customToken });
        }

        return res.status(400).json({ error: 'Invalid action type' });

    } catch (error) {
        console.error('[email-auth] Error:', error);
        return res.status(500).json({ error: 'Operation failed', details: error.message });
    }
}
