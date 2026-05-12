const express = require('express');
const { body } = require('express-validator');
const {
  getDiagnoses,
  getDiagnosisById,
  createDiagnosis,
  updateDiagnosis,
  deleteDiagnosis,
  getDiagnosesByPatient
} = require('../controllers/diagnosisController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

const diagnosisValidation = [
  body('patient').isMongoId().withMessage('Valid patient is required'),
  body('icdCode').trim().notEmpty().withMessage('ICD code is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('severity').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity'),
  body('notes').optional({ checkFalsy: true }).trim(),
  body('diagnosedDate').isISO8601().withMessage('Valid diagnosed date is required')
];

router.use(protect, authorize('admin', 'clinician'));

router.route('/').get(getDiagnoses).post(authorize('admin'), diagnosisValidation, createDiagnosis);
router.get('/patient/:patientId', getDiagnosesByPatient);
router
  .route('/:id')
  .get(getDiagnosisById)
  .put(diagnosisValidation, updateDiagnosis)
  .delete(authorize('admin'), deleteDiagnosis);

module.exports = router;
