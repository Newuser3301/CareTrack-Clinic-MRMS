const User = require('../models/User');

const resolveSuperAdminConfig = (env = process.env) => {
  const email = env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = env.SUPER_ADMIN_PASSWORD;
  const name = env.SUPER_ADMIN_NAME?.trim() || 'Super Admin';

  if (!email && !password) return null;

  if (!email || !password) {
    throw new Error('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be provided together');
  }

  return { email, password, name };
};

const bootstrapSuperAdmin = async (env = process.env) => {
  const config = resolveSuperAdminConfig(env);
  if (!config) {
    return { skipped: true, reason: 'missing_env' };
  }

  const existingByEmail = await User.findOne({ email: config.email }).select('+password');
  const existingSuperAdmin = existingByEmail ? null : await User.findOne({ role: 'super_admin' }).select('+password');
  const user = existingByEmail || existingSuperAdmin;

  if (user) {
    user.name = config.name;
    user.email = config.email;
    user.password = config.password;
    user.role = 'super_admin';
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    return { skipped: false, action: 'updated', userId: user._id.toString(), email: user.email };
  }

  const created = await User.create({
    name: config.name,
    email: config.email,
    password: config.password,
    role: 'super_admin'
  });

  return { skipped: false, action: 'created', userId: created._id.toString(), email: created.email };
};

module.exports = { resolveSuperAdminConfig, bootstrapSuperAdmin };
