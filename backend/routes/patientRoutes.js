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

const router = express.Router();

const patientValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('gender').isIn(['female', 'male', 'other']).withMessage('Invalid gender'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('assignedDoctor').isMongoId().withMessage('Valid assigned doctor is required'),
  body('emergencyContact').trim().notEmpty().withMessage('Emergency contact is required')
];

router.use(protect);

router
  .route('/')
  .get(authorize('admin', 'clinician', 'receptionist'), getPatients)
  .post(authorize('admin', 'receptionist'), patientValidation, createPatient);

router.get('/:id/profile', authorize('admin', 'clinician', 'receptionist'), getPatientProfile);

router
  .route('/:id')
  .get(authorize('admin', 'clinician', 'receptionist'), getPatientById)
  .put(authorize('admin', 'clinician'), patientValidation, updatePatient)
  .delete(authorize('admin'), deletePatient);

module.exports = router;
