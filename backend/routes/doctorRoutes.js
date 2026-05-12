const express = require('express');
const { body } = require('express-validator');
const {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor
} = require('../controllers/doctorController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

const doctorValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('specialty').trim().notEmpty().withMessage('Specialty is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('availability').trim().notEmpty().withMessage('Availability is required')
];

router.use(protect);

router.route('/').get(authorize('admin', 'receptionist'), getDoctors).post(authorize('admin'), doctorValidation, createDoctor);
router
  .route('/:id')
  .get(authorize('admin', 'receptionist'), getDoctorById)
  .put(authorize('admin'), doctorValidation, updateDoctor)
  .delete(authorize('admin'), deleteDoctor);

module.exports = router;
