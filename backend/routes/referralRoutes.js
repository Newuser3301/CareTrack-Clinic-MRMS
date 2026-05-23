const express = require('express');
const { body } = require('express-validator');
const {
  getReferrals,
  getReferralById,
  createReferral,
  updateReferral,
  deleteReferral
} = require('../controllers/referralController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

const referralValidation = [
  body('patient').optional({ checkFalsy: true }).isMongoId().withMessage('Valid patient is required'),
  body('fromDoctor').optional({ checkFalsy: true }).isMongoId().withMessage('Valid fromDoctor is required'),
  body('toDoctor').optional({ checkFalsy: true }).isMongoId().withMessage('Valid toDoctor is required'),
  body('toDepartment').optional({ checkFalsy: true }).trim().isLength({ max: 120 }).withMessage('toDepartment is too long'),
  body('institutionName').optional({ checkFalsy: true }).trim().isLength({ max: 160 }).withMessage('Institution name is too long'),
  body('referralNumber').optional({ checkFalsy: true }).trim().isLength({ max: 60 }).withMessage('Referral number is too long'),
  body('validityPeriod').optional({ checkFalsy: true }).trim().isLength({ max: 120 }).withMessage('Validity period is too long'),
  body('responsibleDoctorName').optional({ checkFalsy: true }).trim().isLength({ max: 120 }).withMessage('Responsible doctor name is too long'),
  body('receptionistName').optional({ checkFalsy: true }).trim().isLength({ max: 120 }).withMessage('Receptionist name is too long'),
  body('reason').optional().trim().notEmpty().withMessage('Reason is required'),
  body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }).withMessage('Notes is too long'),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority'),
  body('status').optional().isIn(['pending', 'accepted', 'rejected', 'completed', 'cancelled']).withMessage('Invalid status')
];

router.use(protect);

router
  .route('/')
  .get(authorize('super_admin', 'admin', 'doctor', 'clinician', 'receptionist', 'patient'), getReferrals)
  .post(
    authorize('super_admin', 'admin', 'doctor', 'clinician'),
    [
      body('patient').isMongoId().withMessage('Valid patient is required'),
      body('fromDoctor').optional({ checkFalsy: true }).isMongoId().withMessage('Valid fromDoctor is required'),
      body('toDoctor').optional({ checkFalsy: true }).isMongoId().withMessage('Valid toDoctor is required'),
      body('toDepartment').optional({ checkFalsy: true }).trim().isLength({ max: 120 }).withMessage('toDepartment is too long'),
      body('institutionName').optional({ checkFalsy: true }).trim().isLength({ max: 160 }).withMessage('Institution name is too long'),
      body('referralNumber').optional({ checkFalsy: true }).trim().isLength({ max: 60 }).withMessage('Referral number is too long'),
      body('validityPeriod').optional({ checkFalsy: true }).trim().isLength({ max: 120 }).withMessage('Validity period is too long'),
      body('responsibleDoctorName').optional({ checkFalsy: true }).trim().isLength({ max: 120 }).withMessage('Responsible doctor name is too long'),
      body('receptionistName').optional({ checkFalsy: true }).trim().isLength({ max: 120 }).withMessage('Receptionist name is too long'),
      body('reason').trim().notEmpty().withMessage('Reason is required'),
      body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }).withMessage('Notes is too long'),
      body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority'),
      body('status').optional().isIn(['pending', 'accepted', 'rejected', 'completed', 'cancelled']).withMessage('Invalid status')
    ],
    createReferral
  );

router
  .route('/:id')
  .get(authorize('super_admin', 'admin', 'doctor', 'clinician', 'receptionist', 'patient'), getReferralById)
  .put(authorize('super_admin', 'admin', 'doctor', 'clinician'), referralValidation, updateReferral)
  .delete(authorize('super_admin', 'admin'), deleteReferral);

module.exports = router;
