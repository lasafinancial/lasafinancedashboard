// api/razorpay/verify-payment.js — Vercel serverless function (mirrors the
// /api/razorpay/verify-payment route in server.cjs, used for local dev)
import crypto from 'crypto';
import admin from 'firebase-admin';

function getFirebaseCredentials() {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
    if (!key && !base64Key) return null;
    try {
        let credentials;
        if (base64Key) {
            credentials = JSON.parse(Buffer.from(base64Key, 'base64').toString('utf-8'));
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

const RAZORPAY_PLANS = {
    'starter': { name: 'Starter', priceQuarterly: 0, priceAnnual: 0, tier: 'free' },
    'trader': { name: 'Trader', priceQuarterly: 2400, priceAnnual: 7200, tier: 'pro' },
    'pro_trader': { name: 'Pro Trader', priceQuarterly: 3600, priceAnnual: 10800, tier: 'elite' },
    'standalone_rotation': { name: 'Dynamic Portfolio Rotation', priceQuarterly: 2400, priceAnnual: 7200, tier: 'pro' },
};

function getLocalPlanDetails(planId, billingCycle = 'quarterly') {
    const plan = RAZORPAY_PLANS[planId];
    if (!plan) return null;
    const amount = billingCycle === 'annual' ? plan.priceAnnual : plan.priceQuarterly;
    return { ...plan, amount };
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            planId,
            billingCycle = 'quarterly',
            userId,
            userEmail,
            userPhone,
        } = req.body || {};

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ error: 'Missing payment response attributes' });
        }

        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keySecret) {
            console.error('[RAZORPAY] Missing RAZORPAY_KEY_SECRET in environment.');
            return res.status(500).json({ error: 'Payment verification secret is not configured on the server.' });
        }

        const generatedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            console.warn(`[RAZORPAY] Invalid signature for order ${razorpay_order_id}`);
            return res.status(400).json({
                success: false,
                error: 'Invalid payment signature. Verification failed.',
            });
        }

        console.log(`[RAZORPAY] Payment verified successfully: ${razorpay_payment_id}`);

        const plan = getLocalPlanDetails(planId, billingCycle) || { name: 'Pro Plan', tier: 'pro', amount: 0 };
        const daysToAdd = billingCycle === 'annual' ? 365 : 90;
        const expiresDate = new Date();
        expiresDate.setDate(expiresDate.getDate() + daysToAdd);

        if (admin.apps.length) {
            const db = admin.firestore();
            if (userId) {
                await db.collection('users').doc(userId).set({
                    tier: plan.tier,
                    subscription: {
                        status: 'active',
                        planId,
                        planName: plan.name,
                        billingCycle,
                        amount: plan.amount,
                        paymentId: razorpay_payment_id,
                        orderId: razorpay_order_id,
                        gateway: 'razorpay',
                        purchasedAt: admin.firestore.FieldValue.serverTimestamp(),
                        expiresAt: expiresDate.toISOString(),
                    },
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
                console.log(`[RAZORPAY] Updated user ${userId} to tier ${plan.tier}`);
            }

            await db.collection('payments').add({
                userId: userId || 'anonymous',
                userEmail: userEmail || '',
                userPhone: userPhone || '',
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
                planId,
                planName: plan.name,
                billingCycle,
                amount: plan.amount,
                currency: 'INR',
                status: 'paid',
                method: 'razorpay',
                signature: razorpay_signature,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                expiresAt: expiresDate.toISOString(),
            });
        }

        return res.status(200).json({
            success: true,
            tier: plan.tier,
            planName: plan.name,
            paymentId: razorpay_payment_id,
            expiresAt: expiresDate.toISOString(),
            message: 'Payment verified and plan activated successfully!',
        });
    } catch (err) {
        console.error('[RAZORPAY] Error verifying payment:', err);
        return res.status(500).json({ error: err.message || 'Payment verification failed' });
    }
}
