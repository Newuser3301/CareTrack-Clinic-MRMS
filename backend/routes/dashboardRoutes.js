const express = require('express');
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/stats', protect, authorize('admin', 'clinician', 'receptionist'), getDashboardStats);

module.exports = router;
