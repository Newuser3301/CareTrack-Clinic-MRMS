const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RevokedToken = require('../models/RevokedToken');

const protect = async (req, res, next) => {
  let token;

  if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    return next(new Error('Not authorized, token missing'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.jti && (await RevokedToken.exists({ jti: decoded.jti }))) {
      res.status(401);
      return next(new Error('Not authorized, token revoked'));
    }

    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized, user no longer exists'));
    }

    if ((req.user.tokenVersion || 0) !== (decoded.tokenVersion || 0)) {
      res.status(401);
      return next(new Error('Not authorized, session expired'));
    }

    req.tokenJti = decoded.jti;
    req.tokenExpiresAt = decoded.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 15 * 60 * 1000);
    return next();
  } catch (error) {
    res.status(401);
    return next(new Error('Not authorized, token invalid'));
  }
};

module.exports = { protect };
