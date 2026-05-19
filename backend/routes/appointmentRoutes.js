const express = require('express');
const { body } = require('express-validator');
const { createAppointment } = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  authorize('super_admin', 'admin', 'receptionist', 'patient'),
  [
    body('doctor_id').isMongoId().withMessage('Valid doctor_id is required'),
    body('patient_id').isMongoId().withMessage('Valid patient_id is required'),
    body('date').isISO8601({ strict: true }).withMessage('Valid date is required'),
    body('time').matches(/^\d{2}:\d{2}$/).withMessage('Valid time is required')
  ],
  createAppointment
);

module.exports = router;

