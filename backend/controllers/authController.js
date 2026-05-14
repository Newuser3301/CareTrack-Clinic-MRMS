const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const RefreshSession = require('../models/RefreshSession');
const RevokedToken = require('../models/RevokedToken');
const { generateAccessToken, generateRefreshToken, hashToken, parseDuration } = require('../utils/generateToken');
const { validatePassword } = require('../utils/passwordPolicy');
const { sendPasswordResetEmail } = require('../utils/email');

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path: '/'
};

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role
});

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    next(new Error(errors.array().map((error) => error.msg).join(', ')));
    return false;
  }
  return true;
};

const setAuthCookies = async (res, req, user) => {
  const access = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  const refreshMs = parseDuration(process.env.REFRESH_TOKEN_EXPIRES_IN || '7d', 7 * 24 * 60 * 60 * 1000);
  const refreshExpires = new Date(Date.now() + refreshMs);

  await RefreshSession.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    userAgent: req.get('user-agent'),
    ip: req.ip,
    expiresAt: refreshExpires
  });

  res.cookie('accessToken', access.token, {
    ...cookieOptions,
    maxAge: access.expiresAt.getTime() - Date.now()
  });
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: refreshMs
  });

  return access;
};

const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
};

const sendAuthResponse = async (req, res, user, statusCode = 200) => {
  await setAuthCookies(res, req, user);
  res.status(statusCode).json({ user: publicUser(user) });
};

const register = async (req, res, next) => {
  if (!handleValidation(req, res, next)) return;

  try {
    const { name, email, password, role } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(409);
      throw new Error('User with this email already exists');
    }

    const user = await User.create({ name, email, password, role });
    return sendAuthResponse(req, res, user, 201);
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  if (!handleValidation(req, res, next)) return;

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    if (user.isLocked()) {
      res.status(423);
      throw new Error('Account temporarily locked. Please try again later.');
    }

    if (!(await user.matchPassword(password))) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= Number(process.env.MAX_LOGIN_ATTEMPTS || 5)) {
        user.lockUntil = new Date(Date.now() + parseDuration(process.env.ACCOUNT_LOCK_TIME || '15m', 15 * 60 * 1000));
      }
      await user.save({ validateBeforeSave: false });
      res.status(401);
      throw new Error('Invalid email or password');
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save({ validateBeforeSave: false });

    return sendAuthResponse(req, res, user);
  } catch (error) {
    return next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401);
      throw new Error('Refresh token missing');
    }

    const session = await RefreshSession.findOne({
      tokenHash: hashToken(token),
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() }
    }).populate('user');

    if (!session || !session.user) {
      clearAuthCookies(res);
      res.status(401);
      throw new Error('Refresh token invalid');
    }

    session.revokedAt = new Date();
    await session.save();
    await setAuthCookies(res, req, session.user);
    res.json({ user: publicUser(session.user) });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    if (req.cookies?.refreshToken) {
      await RefreshSession.updateMany({ tokenHash: hashToken(req.cookies.refreshToken) }, { $set: { revokedAt: new Date() } });
    }

    if (req.tokenJti && req.tokenExpiresAt) {
      await RevokedToken.create({ jti: req.tokenJti, user: req.user?._id, expiresAt: req.tokenExpiresAt }).catch(() => {});
    }

    clearAuthCookies(res);
    res.json({ message: 'Logged out' });
  } catch (error) {
    next(error);
  }
};

const logoutAll = async (req, res, next) => {
  try {
    await RefreshSession.updateMany({ user: req.user._id, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } });
    await User.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });
    clearAuthCookies(res);
    res.json({ message: 'All sessions revoked' });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  if (!handleValidation(req, res, next)) return;

  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!user || !(await user.matchPassword(req.body.currentPassword))) {
      res.status(401);
      throw new Error('Current password is incorrect');
    }

    if (!validatePassword(req.body.newPassword)) {
      res.status(400);
      throw new Error('Password does not meet complexity requirements');
    }

    user.password = req.body.newPassword;
    user.tokenVersion += 1;
    await user.save();
    await RefreshSession.updateMany({ user: user._id, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } });
    await setAuthCookies(res, req, user);
    res.json({ message: 'Password changed', user: publicUser(user) });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  if (!handleValidation(req, res, next)) return;

  try {
    const user = await User.findOne({ email: req.body.email }).select('+passwordResetToken +passwordResetExpires');
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = hashToken(resetToken);
      user.passwordResetExpires = new Date(Date.now() + parseDuration(process.env.PASSWORD_RESET_EXPIRES_IN || '15m', 15 * 60 * 1000));
      await user.save({ validateBeforeSave: false });
      const frontendUrl = (process.env.FRONTEND_URL || '').split(',')[0];
      const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
      await sendPasswordResetEmail({ to: user.email, resetUrl, resetToken });

      if (process.env.NODE_ENV !== 'production') {
        return res.json({ message: 'Password reset token generated', resetToken });
      }
    }

    return res.json({ message: 'If the email exists, a reset link has been generated.' });
  } catch (error) {
    return next(error);
  }
};

const resetPassword = async (req, res, next) => {
  if (!handleValidation(req, res, next)) return;

  try {
    const user = await User.findOne({
      passwordResetToken: hashToken(req.params.token),
      passwordResetExpires: { $gt: new Date() }
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      res.status(400);
      throw new Error('Password reset token is invalid or expired');
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.tokenVersion += 1;
    await user.save();
    await RefreshSession.updateMany({ user: user._id, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } });
    await sendAuthResponse(req, res, user);
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res) => {
  res.json({ user: publicUser(req.user) });
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  changePassword,
  forgotPassword,
  resetPassword,
  getMe
};
