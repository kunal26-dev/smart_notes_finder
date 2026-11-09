const express = require('express');
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateObjectIdParam } = require('../middleware/validateObjectId');

const router = express.Router();
router.param('id', validateObjectIdParam);
router.use(protect);

router.route('/').get(getCategories).post(authorize('Admin'), createCategory);
router.route('/:id')
  .get(getCategoryById)
  .put(authorize('Admin'), updateCategory)
  .patch(authorize('Admin'), updateCategory)
  .delete(authorize('Admin'), deleteCategory);

module.exports = router;
