const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const AuditLog = require('../models/AuditLog');

const passThrough = (req, res, next) => next();
const authLimiter = passThrough;
const apiLimiter = passThrough;
const apiSlowDown = passThrough;

const sanitizeString = (value) =>
  typeof value === 'string'
    ? value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/javascript:/gi, '')
    : value;

const deepSanitize = (value) => {
  if (Array.isArray(value)) return value.map(deepSanitize);
  if (value && typeof value === 'object') {
    Object.keys(value).forEach((key) => {
      value[key] = deepSanitize(value[key]);
    });
    return value;
  }
  return sanitizeString(value);
};

const sanitizeBody = (req, res, next) => {
  if (req.body) req.body = deepSanitize(req.body);
  if (req.query) req.query = deepSanitize(req.query);
  if (req.params) req.params = deepSanitize(req.params);
  next();
};

const rejectMultipart = (req, res, next) => {
  if (req.is('multipart/form-data')) {
    res.status(415);
    return next(new Error('File uploads are not enabled for this API.'));
  }
  return next();
};

const requireHttps = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && process.env.ENFORCE_HTTPS !== 'false') {
    const proto = req.headers['x-forwarded-proto'];
    if (proto && proto !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
    }
  }
  return next();
};

const auditLogger = (req, res, next) => {
  const shouldAudit =
    req.path.includes('/patients') ||
    req.path.includes('/diagnoses') ||
    req.path.includes('/doctors') ||
    req.path.includes('/users') ||
    req.path.includes('/auth');

  if (!shouldAudit) return next();

  res.on('finish', () => {
    if (req.method === 'GET' && res.statusCode < 400 && !req.path.includes('/patients') && !req.path.includes('/diagnoses')) {
      return;
    }

    AuditLog.create({
      actor: req.user?._id,
      actorRole: req.user?.role,
      action: `${req.method} ${req.route?.path || req.path}`,
      resource: req.baseUrl?.split('/').pop() || 'api',
      resourceId: req.params?.id || req.params?.patientId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      metadata: {
        query: req.query
      }
    }).catch(() => {});
  });

  return next();
};

module.exports = {
  authLimiter,
  apiLimiter,
  apiSlowDown,
  mongoSanitize,
  hpp,
  sanitizeBody,
  rejectMultipart,
  requireHttps,
  auditLogger
};
