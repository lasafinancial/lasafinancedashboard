// api/verify-otp.js — Twilio Verify: check OTP, then issue Firebase custom token
import twilio from 'twilio';
import admin from 'firebase-admin';

// ── Firebase Admin Init ──────────────────────────────────────────────────────
if (!admin.apps.length) {
    let credential;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            // Support both direct JSON string and stringified shell escape
            let keyStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
            if ((keyStr.startsWith("'") && keyStr.endsWith("'")) || (keyStr.startsWith('"') && keyStr.endsWith('"'))) {
                keyStr = keyStr.slice(1, -1);
            }
            const serviceAccount = JSON.parse(keyStr);
            credential = admin.credential.cert(serviceAccount);
        } catch (e) {
            console.error('[verify-otp] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', e.message);
        }
    }

    admin.initializeApp({
        credential: credential ?? admin.credential.applicationDefault(),
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
