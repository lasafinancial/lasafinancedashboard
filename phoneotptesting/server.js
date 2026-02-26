const express = require('express');
const twilio = require('twilio');
const cors = require('cors');
const path = require('path');

const app = express();

// Twilio credentials (should be in .env)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;

const client = twilio(accountSid, authToken);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// POST /send-otp
app.post('/send-otp', async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number is required.' });
  }

  // Ensure phone has country code
  const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

  try {
    const verification = await client.verify.v2
      .services(serviceSid)
      .verifications.create({ to: formattedPhone, channel: 'sms' });

    console.log(`OTP sent to ${formattedPhone} | Status: ${verification.status}`);
    res.json({ success: true, message: `OTP sent to ${formattedPhone}` });
  } catch (err) {
    console.error('Error sending OTP:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /verify-otp
app.post('/verify-otp', async (req, res) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ success: false, message: 'Phone and OTP code are required.' });
  }

  const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

  try {
    const verificationCheck = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to: formattedPhone, code });

    console.log(`OTP check for ${formattedPhone} | Status: ${verificationCheck.status}`);

    if (verificationCheck.status === 'approved') {
      res.json({ success: true, message: 'OTP verified successfully! Login granted.' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }
  } catch (err) {
    console.error('Error verifying OTP:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`📱 Twilio OTP Login ready!\n`);
});
