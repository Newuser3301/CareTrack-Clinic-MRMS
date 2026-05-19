const express = require('express');
const { body } = require('express-validator');
const {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor
} = require('../controllers/doctorController');
const { getDoctorAvailableTimes } = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { passwordPolicyMessage, validatePassword } = require('../utils/passwordPolicy');

const router = express.Router();

const doctorValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('specialty').trim().notEmpty().withMessage('Specialty is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('availability').trim().notEmpty().withMessage('Availability is required')
];
const createDoctorValidation = [
  ...doctorValidation,
  body('password').custom(validatePassword).withMessage(passwordPolicyMessage)
];
const updateDoctorValidation = [
  ...doctorValidation,
  body('password').optional({ checkFalsy: true }).custom(validatePassword).withMessage(passwordPolicyMessage)
];

router.use(protect);

router.get(
  '/:id/available-times',
  authorize('super_admin', 'admin', 'doctor', 'patient', 'receptionist'),
  getDoctorAvailableTimes
);

router
  .route('/')
  .get(authorize('super_admin', 'admin', 'doctor', 'patient', 'receptionist'), getDoctors)
  .post(authorize('super_admin', 'admin'), createDoctorValidation, createDoctor);
router
  .route('/:id')
  .get(authorize('super_admin', 'admin', 'doctor', 'patient', 'receptionist'), getDoctorById)
  .put(authorize('super_admin', 'admin'), updateDoctorValidation, updateDoctor)
  .delete(authorize('super_admin', 'admin'), deleteDoctor);

module.exports = router;
