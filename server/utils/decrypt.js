const crypto = require('crypto');

const SHARED_SECRET = process.env.ENCRYPTION_SECRET; // must match frontend

function decryptToken(encryptedBase64, ivBase64) {
  // 🔐 Step 1: Create 32-byte key from secret using SHA-256
  const key = crypto.createHash('sha256').update(SHARED_SECRET).digest(); // always 32 bytes

  const iv = Buffer.from(ivBase64, 'base64');
  const encrypted = Buffer.from(encryptedBase64, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
}

module.exports = decryptToken;
