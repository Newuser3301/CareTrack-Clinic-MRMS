const crypto = require('crypto');

const getKey = () => {
  const secret = process.env.FIELD_ENCRYPTION_KEY || process.env.JWT_SECRET;
  return crypto.createHash('sha256').update(secret || 'development-only-field-key').digest();
};

const encryptText = (value) => {
  if (!value || String(value).startsWith('enc:')) return value;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
};

const decryptText = (value) => {
  if (!value || !String(value).startsWith('enc:')) return value;
  try {
    const [, ivHex, tagHex, encryptedHex] = String(value).split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]).toString('utf8');
  } catch {
    return '[Secure note unavailable]';
  }
};

module.exports = { encryptText, decryptText };
