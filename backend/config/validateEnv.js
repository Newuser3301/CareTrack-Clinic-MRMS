const { resolveSuperAdminConfig } = require('../utils/bootstrapSuperAdmin');

const validateEnv = () => {
  const required = ['MONGO_URI', 'JWT_SECRET', 'FRONTEND_URL'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if ((process.env.JWT_SECRET || '').length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  if (process.env.NODE_ENV === 'production') {
    const origins = process.env.FRONTEND_URL.split(',').map((origin) => origin.trim());
    if (origins.some((origin) => origin.includes('localhost') || origin.startsWith('http://'))) {
      throw new Error('Production FRONTEND_URL must use trusted HTTPS origins, not localhost or http://');
    }
  }

  resolveSuperAdminConfig(process.env);
};

module.exports = validateEnv;
