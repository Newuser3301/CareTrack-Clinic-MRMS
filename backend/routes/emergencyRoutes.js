const express = require('express');
const { body } = require('express-validator');
const { getEmergencies, createEmergency, updateEmergency } = require('../controllers/emergencyController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorize('super_admin', 'admin', 'doctor', 'clinician', 'receptionist', 'patient'), getEmergencies)
  .post(
    authorize('super_admin', 'admin', 'doctor', 'clinician', 'receptionist', 'patient'),
    [
      body('patient').optional({ checkFalsy: true }).isMongoId().withMessage('Valid patient is required'),
      body('department').optional({ checkFalsy: true }).trim().isLength({ max: 120 }).withMessage('Department is too long'),
      body('subject').trim().notEmpty().withMessage('Subject is required'),
      body('message').trim().notEmpty().withMessage('Message is required')
    ],
    createEmergency
  );

router.put(
  '/:id',
  authorize('super_admin', 'admin', 'doctor', 'clinician', 'receptionist'),
  [
    body('status').optional().isIn(['open', 'in_progress', 'resolved', 'closed']).withMessage('Invalid status'),
    body('resolutionNote').optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('Resolution note is too long')
  ],
  updateEmergency
);

module.exports = router;

