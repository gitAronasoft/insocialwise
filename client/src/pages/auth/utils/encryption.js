import CryptoJS from 'crypto-js';

const SHARED_SECRET = process.env.REACT_APP_ENCRYPTION_SECRET;

export function encryptToken(plaintext) {
  const iv = CryptoJS.lib.WordArray.random(16);
  const key = CryptoJS.SHA256(SHARED_SECRET); // ✅ hash to 256-bit key

  const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return {
    iv: iv.toString(CryptoJS.enc.Base64),
    token: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
  };
}
