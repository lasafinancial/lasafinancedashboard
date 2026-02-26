const twilio = require('twilio');
const fs = require('fs');
const path = require('path');

function parseEnv() {
    const envPath = path.join(__dirname, '.env');
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex === -1) return;
        const key = trimmed.slice(0, eqIndex).trim();
        const value = trimmed.slice(eqIndex + 1).trim();
        env[key] = value;
    });
    return env;
}

const env = parseEnv();
const accountSid = env.TWILIO_ACCOUNT_SID;
const authToken = env.TWILIO_AUTH_TOKEN;
const serviceSid = env.TWILIO_VERIFY_SERVICE_SID;

const client = twilio(accountSid, authToken);

client.verify.v2.services(serviceSid)
    .verifications
    .list({ to: '+919311489386', limit: 5 })
    .then(v => {
        console.log('Recent attempts:');
        v.forEach(x => {
            console.log(`ID: ${x.sid} | Status: ${x.status} | To: ${x.to} | Created: ${x.dateCreated}`);
        });
    })
    .catch(e => console.error('Error:', e.message));
