const test = require('node:test');
const assert = require('node:assert/strict');
const { validatePassword } = require('../utils/passwordPolicy');
const { isSuperAdmin, isAdmin, isSystemManager } = require('../utils/rbac');
const validateEnv = require('../config/validateEnv');
const { resolveSuperAdminConfig } = require('../utils/bootstrapSuperAdmin');

test('password policy rejects weak passwords', () => {
  assert.equal(validatePassword('Admin12345'), false);
  assert.equal(validatePassword('short!A1'), false);
  assert.equal(validatePassword('StrongPass123!'), true);
});

test('RBAC system manager helpers identify privileged roles only', () => {
  assert.equal(isSuperAdmin({ role: 'super_admin' }), true);
  assert.equal(isAdmin({ role: 'admin' }), true);
  assert.equal(isSystemManager({ role: 'doctor' }), false);
  assert.equal(isSystemManager({ role: 'patient' }), false);
});

test('production env validation rejects insecure frontend origins', () => {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    FRONTEND_URL: process.env.FRONTEND_URL
  };

  process.env.NODE_ENV = 'production';
  process.env.MONGO_URI = 'mongodb://example';
  process.env.JWT_SECRET = 'a'.repeat(40);
  process.env.FRONTEND_URL = 'http://localhost:5173';

  assert.throws(() => validateEnv(), /Production FRONTEND_URL/);

  Object.entries(previous).forEach(([key, value]) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  });
});

test('super admin env config requires email and password together', () => {
  assert.equal(resolveSuperAdminConfig({}), null);
  assert.throws(() => resolveSuperAdminConfig({ SUPER_ADMIN_EMAIL: 'admin@example.com' }), /must be provided together/);
  assert.deepEqual(resolveSuperAdminConfig({
    SUPER_ADMIN_EMAIL: ' Admin@Example.com ',
    SUPER_ADMIN_PASSWORD: 'StrongPass123!',
    SUPER_ADMIN_NAME: 'System Owner'
  }), {
    email: 'admin@example.com',
    password: 'StrongPass123!',
    name: 'System Owner'
  });
});
