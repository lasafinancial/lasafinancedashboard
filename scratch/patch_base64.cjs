const fs = require('fs');

const cleanBase64 = fs.readFileSync('scratch/clean_base64.txt', 'utf-8').trim();

const files = [
  'api/admin/send-broadcast.js',
  'api/send-notification.js',
  'api/save-token.js'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/const FALLBACK_BASE64 = '[^']+';/, `const FALLBACK_BASE64 = '${cleanBase64}';`);
  fs.writeFileSync(file, content, 'utf-8');
  console.log(`Updated ${file} with clean Base64!`);
});
