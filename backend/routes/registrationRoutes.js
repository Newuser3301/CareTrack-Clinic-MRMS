const express = require('express');
const { body } = require('express-validator');
const {
  getRegistrations,
  getRegistrationById,
  createRegistration,
  approveRegistration,
  rejectRegistration
} = require('../controllers/registrationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { passwordPolicyMessage, validatePassword } = require('../utils/passwordPolicy');

const router = express.Router();

const registrationValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('gender').isIn(['female', 'male', 'other']).withMessage('Invalid gender'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('assignedDoctor').isMongoId().withMessage('Valid assigned doctor is required'),
  body('emergencyContact').trim().notEmpty().withMessage('Emergency contact is required')
];

router.use(protect);

router.get('/', authorize('super_admin', 'admin', 'receptionist'), getRegistrations);
router.get('/:id', authorize('super_admin', 'admin', 'receptionist'), getRegistrationById);
router.post('/', authorize('super_admin', 'admin', 'receptionist'), registrationValidation, createRegistration);

router.post(
  '/:id/approve',
  authorize('super_admin', 'admin'),
  [body('password').custom(validatePassword).withMessage(passwordPolicyMessage)],
  approveRegistration
);

router.post(
  '/:id/reject',
  authorize('super_admin', 'admin'),
  [body('rejectionReason').optional({ checkFalsy: true }).trim().isLength({ max: 400 }).withMessage('Rejection reason is too long')],
  rejectRegistration
);

module.exports = router;

