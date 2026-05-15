const express = require('express');
const { body } = require('express-validator');
const {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientProfile
} = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { canAccessPatient } = require('../middleware/ownershipMiddleware');
const { passwordPolicyMessage, validatePassword } = require('../utils/passwordPolicy');

const router = express.Router();

const patientValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('gender').isIn(['female', 'male', 'other']).withMessage('Invalid gender'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('assignedDoctor').isMongoId().withMessage('Valid assigned doctor is required'),
  body('emergencyContact').trim().notEmpty().withMessage('Emergency contact is required')
];
const createPatientValidation = [
  ...patientValidation,
  body('password').custom(validatePassword).withMessage(passwordPolicyMessage)
];
const updatePatientValidation = [
  ...patientValidation,
  body('password').optional({ checkFalsy: true }).custom(validatePassword).withMessage(passwordPolicyMessage)
];

router.use(protect);

router
  .route('/')
  .get(authorize('super_admin', 'admin', 'doctor', 'clinician', 'receptionist', 'patient'), getPatients)
  .post(authorize('super_admin', 'admin', 'receptionist'), createPatientValidation, createPatient);

router.get('/:id/profile', authorize('super_admin', 'admin', 'doctor', 'clinician', 'receptionist', 'patient'), canAccessPatient(), getPatientProfile);

router
  .route('/:id')
  .get(authorize('super_admin', 'admin', 'doctor', 'clinician', 'receptionist', 'patient'), canAccessPatient(), getPatientById)
  .put(authorize('super_admin', 'admin', 'doctor', 'clinician'), canAccessPatient({ write: true }), updatePatientValidation, updatePatient)
  .delete(authorize('super_admin', 'admin'), deletePatient);

module.exports = router;
