const crypto = require('crypto');
const SECRET = process.env.ENCRYPTION_SECRET;          // 32‑byte secret

function encryptToken(plaintext) {
  const key = crypto.createHash('sha256').update(SECRET).digest(); // 32 bytes
  const iv  = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return {
    token: encrypted.toString('base64'),
    iv:    iv.toString('base64')
  };
}

module.exports = encryptToken;