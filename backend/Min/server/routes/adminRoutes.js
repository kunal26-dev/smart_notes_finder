const express = require('express');
const {
  getAllUsers,
  getUserById,
  updateUser,
  changeUserRole,
  updateUserStatus,
  deleteUser,
  getAllResources,
  getPendingResources,
  getResourceById,
  approveResource,
  rejectResource,
  deleteResource,
} = require('../controllers/adminController');
const { getAdminDashboard } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateObjectIdParam } = require('../middleware/validateObjectId');

const router = express.Router();
router.param('id', validateObjectIdParam);
// Every admin route requires a valid token AND the Admin role
router.use(protect, authorize('Admin'));

router.get('/dashboard', getAdminDashboard);

// Users
router.get('/users', getAllUsers);
router.route('/users/:id').get(getUserById).put(updateUser).delete(deleteUser);
router.patch('/users/:id/role', changeUserRole);
router.patch('/users/:id/status', updateUserStatus);

// Resources (fixed path "/pending" before "/:id")
router.get('/resources', getAllResources);
router.get('/resources/pending', getPendingResources);
router.route('/resources/:id').get(getResourceById).delete(deleteResource);
router.patch('/resources/:id/approve', approveResource);
router.patch('/resources/:id/reject', rejectResource);

module.exports = router;
