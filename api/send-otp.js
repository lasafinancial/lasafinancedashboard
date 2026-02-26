// api/send-otp.js — Twilio Verify: send OTP via SMS
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

const client = twilio(accountSid, authToken);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { phoneNumber } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required' });
    }

    // Robust formatting: Clean non-digits first, then re-apply +91 prefix
    let cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.startsWith('91') && cleanPhone.length > 10) {
        cleanPhone = cleanPhone.slice(2);
    }
    const formattedPhone = `+91${cleanPhone}`;

    try {
        console.log(`[send-otp] Sending OTP to: ${formattedPhone}`);

        const verification = await client.verify.v2
            .services(serviceSid)
            .verifications.create({ to: formattedPhone, channel: 'sms' });

        console.log(`[send-otp] Status: ${verification.status}`);

        return res.status(200).json({
            success: true,
            message: `OTP sent to ${formattedPhone}`,
        });
    } catch (err) {
        console.error('[send-otp] Error:', err.message);
        return res.status(500).json({
            error: 'Failed to send OTP',
            details: err.message,
        });
    }
}
