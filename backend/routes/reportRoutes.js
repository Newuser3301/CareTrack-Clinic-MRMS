const express = require('express');
const { getDiagnosisReportJson, getDiagnosisReportHtml } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.get(
  '/patients/:id/diagnosis',
  authorize('super_admin', 'admin', 'doctor', 'clinician', 'receptionist', 'patient'),
  getDiagnosisReportJson
);

router.get(
  '/patients/:id/diagnosis.html',
  authorize('super_admin', 'admin', 'doctor', 'clinician', 'receptionist', 'patient'),
  getDiagnosisReportHtml
);

module.exports = router;

