const express = require('express');
const { body } = require('express-validator');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  createAdmin,
  createDoctorAccount,
  createPatientAccount
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { passwordPolicyMessage, validatePassword } = require('../utils/passwordPolicy');

const router = express.Router();

const userValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').optional({ checkFalsy: true }).custom(validatePassword).withMessage(passwordPolicyMessage),
  body('role').optional().isIn(['super_admin', 'admin', 'doctor', 'patient']).withMessage('Invalid role')
];

router.use(protect, authorize('super_admin', 'admin'));

router.route('/').get(getUsers).post(
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').custom(validatePassword).withMessage(passwordPolicyMessage),
    body('role').isIn(['super_admin', 'admin', 'doctor', 'patient']).withMessage('Invalid role')
  ],
  createUser
);

router.post(
  '/admins',
  authorize('super_admin'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').custom(validatePassword).withMessage(passwordPolicyMessage)
  ],
  createAdmin
);
router.post(
  '/doctor-accounts',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').custom(validatePassword).withMessage(passwordPolicyMessage)
  ],
  createDoctorAccount
);
router.post(
  '/patient-accounts',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').custom(validatePassword).withMessage(passwordPolicyMessage)
  ],
  createPatientAccount
);

router.route('/:id').get(getUserById).put(userValidation, updateUser).delete(deleteUser);

module.exports = router;
