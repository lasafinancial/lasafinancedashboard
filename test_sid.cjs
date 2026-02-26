const twilio = require('twilio');
const fs = require('fs');
const path = require('path');

const accountSid = process.env.TWILIO_ACCOUNT_SID || '[YOUR_ACCOUNT_SID]';
const authToken = process.env.TWILIO_AUTH_TOKEN || '[YOUR_AUTH_TOKEN]';
const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID || '[YOUR_SERVICE_SID]';

const client = twilio(accountSid, authToken);

async function test() {
    try {
        console.log('Testing Twilio Verify SID...');
        const service = await client.verify.v2.services(serviceSid).fetch();
        console.log('SUCCESS: Service found!');
        console.log('Service Name:', service.friendlyName);

        console.log('\nSending test OTP to +919311489386...');
        const ver = await client.verify.v2.services(serviceSid)
            .verifications.create({ to: '+919311489386', channel: 'sms' });
        console.log('Status:', ver.status);
        console.log('SID:', ver.sid);
    } catch (e) {
        console.error('ERROR:', e.message);
        if (e.code === 20404) {
            console.error('TIP: The Service SID "VAbc4..." is likely a placeholder/example ID and NOT your real SID.');
        }
    }
}

test();
