// api/verify-otp.js — Twilio Verify: check OTP, then issue Firebase custom token
import twilio from 'twilio';
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

// ── Twilio Client ────────────────────────────────────────────────────────────
const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);
const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

// ── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { phoneNumber, code } = req.body;

    if (!phoneNumber || !code) {
        return res.status(400).json({ error: 'Phone number and OTP code are required' });
    }

    // Robust formatting: Clean non-digits first, then re-apply +91 prefix
    let cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.startsWith('91') && cleanPhone.length > 10) {
        cleanPhone = cleanPhone.slice(2);
    }
    const formattedPhone = `+91${cleanPhone}`;

    try {
        // Step 1: Verify OTP with Twilio
        console.log(`[verify-otp] Checking code for: ${formattedPhone}`);

        const check = await client.verify.v2
            .services(serviceSid)
            .verificationChecks.create({ to: formattedPhone, code });

        console.log(`[verify-otp] Status: ${check.status} for ${formattedPhone}`);

        if (check.status !== 'approved') {
            return res.status(400).json({ error: 'Invalid or expired OTP. Please try again.' });
        }

        // Step 2: Create or fetch the Firebase user for this phone number
        // We use a deterministic UID so the same phone always maps to the same user record
        const uid = `phone_${formattedPhone.replace('+', '')}`;

        let userRecord;
        try {
            userRecord = await admin.auth().getUser(uid);
        } catch (err) {
            if (err.code === 'auth/user-not-found') {
                userRecord = await admin.auth().createUser({
                    uid,
                    phoneNumber: formattedPhone,
                    displayName: formattedPhone,
                });
                console.log(`[verify-otp] Created new Firebase user: ${uid}`);
            } else {
                throw err;
            }
        }

        // Step 3: Issue a Firebase custom token for the client to sign in with
        const customToken = await admin.auth().createCustomToken(uid);

        return res.status(200).json({ success: true, customToken });

    } catch (err) {
        console.error('[verify-otp] Error:', err.message, err.code ?? '');
        return res.status(500).json({
            error: 'Verification failed',
            details: err.message,
        });
    }
}
