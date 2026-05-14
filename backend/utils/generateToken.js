const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const parseDuration = (value, fallbackMs) => {
  if (!value) return fallbackMs;
  const match = String(value).match(/^(\d+)(ms|s|m|h|d)$/);
  if (!match) return fallbackMs;
  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers = { ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return amount * multipliers[unit];
};

const generateAccessToken = (user) => {
  const jti = crypto.randomUUID();
  const expiresIn = process.env.JWT_EXPIRES_IN || '15m';
  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
      tokenVersion: user.tokenVersion || 0,
      jti
    },
    process.env.JWT_SECRET,
    { expiresIn }
  );

  return {
    token,
    jti,
    expiresAt: new Date(Date.now() + parseDuration(expiresIn, 15 * 60 * 1000))
  };
};

const generateRefreshToken = () => crypto.randomBytes(48).toString('hex');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  parseDuration
};
