const express = require('express');
const {
  uploadResource,
  getResources,
  getMyResources,
  getPendingResources,
  getResourceById,
  updateResource,
  deleteResource,
  downloadResource,
} = require('../controllers/resourceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadSingle } = require('../middleware/uploadMiddleware');
const { validateObjectIdParam } = require('../middleware/validateObjectId');

const router = express.Router();
router.param('id', validateObjectIdParam);
router.use(protect);

router.route('/')
  .get(getResources)
  // authenticate + authorize BEFORE the file is accepted
  .post(authorize('Student', 'Teacher', 'Admin'), uploadSingle, uploadResource);

// Fixed paths must come before "/:id"
router.get('/my', getMyResources);
router.get('/pending', authorize('Admin'), getPendingResources);

router.get('/:id/download', downloadResource);
router.route('/:id')
  .get(getResourceById)
  .put(updateResource)
  .patch(updateResource)
  .delete(deleteResource);

module.exports = router;
