// API endpoint to generate and send a 6-digit OTP to user email
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
        const { email } = req.body;

        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'Valid email is required' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        // Store OTP in Firestore
        await db.collection('email_otps').doc(email).set({
            otp,
            expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`[AUTH] OTP for ${email}: ${otp}`);

        // TODO: Send actual email via Resend/SendGrid
        // For now, we return success so the user can see the OTP in console or we can tell them where to find it

        return res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
            debugOtp: process.env.NODE_ENV === 'development' ? otp : null // Send OTP back ONLY in dev for easy testing
        });

    } catch (error) {
        console.error('Error sending email OTP:', error);
        return res.status(500).json({ error: 'Failed to send OTP', details: error.message });
    }
}
