const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  changePassword,
  forgotPassword,
  resetPassword,
  getSession,
  getMe
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { authLimiter } = require('../middleware/securityMiddleware');
const { passwordPolicyMessage, validatePassword } = require('../utils/passwordPolicy');

const router = express.Router();

router.post(
  '/register',
  protect,
  authorize('super_admin'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').custom(validatePassword).withMessage(passwordPolicyMessage),
    body('role').optional().isIn(['super_admin', 'admin', 'doctor', 'clinician', 'receptionist', 'patient']).withMessage('Invalid role')
  ],
  register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
  ],
  login
);

router.post('/refresh', authLimiter, refresh);
router.get('/session', getSession);
router.post('/logout', protect, logout);
router.post('/logout-all', protect, logoutAll);
router.post(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').custom(validatePassword).withMessage(passwordPolicyMessage)
  ],
  changePassword
);
router.post('/forgot-password', authLimiter, [body('email').isEmail().withMessage('Valid email is required').normalizeEmail()], forgotPassword);
router.post(
  '/reset-password/:token',
  authLimiter,
  [body('password').custom(validatePassword).withMessage(passwordPolicyMessage)],
  resetPassword
);
router.get('/me', getSession);

module.exports = router;
