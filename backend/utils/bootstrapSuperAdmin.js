const User = require('../models/User');
const RefreshSession = require('../models/RefreshSession');

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
  let primaryUser = existingByEmail || existingSuperAdmin;
  let action = 'updated';

  if (primaryUser) {
    primaryUser.name = config.name;
    primaryUser.email = config.email;
    primaryUser.password = config.password;
    primaryUser.role = 'super_admin';
    primaryUser.failedLoginAttempts = 0;
    primaryUser.lockUntil = undefined;
    await primaryUser.save();
  } else {
    primaryUser = await User.create({
      name: config.name,
      email: config.email,
      password: config.password,
      role: 'super_admin'
    });
    action = 'created';
  }

  const obsoleteAccounts = await User.find({
    _id: { $ne: primaryUser._id },
    role: { $in: ['super_admin', 'admin'] }
  }).select('_id');

  if (obsoleteAccounts.length) {
    const obsoleteIds = obsoleteAccounts.map((account) => account._id);
    await RefreshSession.updateMany({ user: { $in: obsoleteIds }, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } });
    await User.deleteMany({ _id: { $in: obsoleteIds } });
  }

  return {
    skipped: false,
    action,
    userId: primaryUser._id.toString(),
    email: primaryUser.email,
    removedSystemAccounts: obsoleteAccounts.length
  };
};

module.exports = { resolveSuperAdminConfig, bootstrapSuperAdmin };
