// api/razorpay/create-order.js — Vercel serverless function (mirrors the
// /api/razorpay/create-order route in server.cjs, used for local dev)
import Razorpay from 'razorpay';

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
    return { ...plan, amount, amountPaise: Math.round(amount * 100) };
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { planId, billingCycle = 'quarterly', userId, userEmail, userPhone } = req.body || {};

        if (!planId) {
            return res.status(400).json({ error: 'planId is required' });
        }

        const plan = getLocalPlanDetails(planId, billingCycle);
        if (!plan) {
            return res.status(400).json({ error: `Invalid planId: ${planId}` });
        }

        if (plan.amount <= 0) {
            return res.status(200).json({
                success: true,
                free: true,
                message: 'Free tier does not require payment',
                tier: 'free',
            });
        }

        const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            console.error('[RAZORPAY] Missing API credentials in environment.');
            return res.status(401).json({
                error: 'Razorpay is not yet configured with API keys. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
            });
        }

        const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const receiptId = `rcpt_${Date.now().toString().slice(-8)}_${Math.floor(Math.random() * 1000)}`;

        const order = await razorpay.orders.create({
            amount: plan.amountPaise,
            currency: 'INR',
            receipt: receiptId,
            notes: {
                userId: userId || 'anonymous',
                userEmail: userEmail || '',
                userPhone: userPhone || '',
                planId,
                billingCycle,
                tier: plan.tier,
            },
        });

        console.log(`[RAZORPAY] Created order ${order.id} for ${plan.name} (Rs${plan.amount})`);

        return res.status(200).json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId,
            planName: plan.name,
            planId,
            billingCycle,
            tier: plan.tier,
        });
    } catch (err) {
        console.error('[RAZORPAY] Error creating order:', err);
        return res.status(500).json({ error: err.message || 'Failed to create order' });
    }
}
