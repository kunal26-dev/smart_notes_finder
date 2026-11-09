const express = require('express');
const { getUserDashboard, getAdminDashboard } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();
router.use(protect);

router.get('/', getUserDashboard);
router.get('/admin', authorize('Admin'), getAdminDashboard);

module.exports = router;
