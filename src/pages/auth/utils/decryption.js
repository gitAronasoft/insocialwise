import CryptoJS from 'crypto-js';

const SECRET = process.env.REACT_APP_ENCRYPTION_SECRET;

export function decryptToken({ token, iv }) {
  const key = CryptoJS.SHA256(SECRET);                         // 32‑byte WordArray
  const ivWA = CryptoJS.enc.Base64.parse(iv);
  const encryptedWA = CryptoJS.enc.Base64.parse(token);

  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext: encryptedWA },
    key,
    { iv: ivWA, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
  );

  return decrypted.toString(CryptoJS.enc.Utf8);
}
