const express = require('express');
const {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
} = require('../controllers/subjectController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateObjectIdParam } = require('../middleware/validateObjectId');

const router = express.Router();
router.param('id', validateObjectIdParam);
router.use(protect);

router.route('/').get(getSubjects).post(authorize('Admin'), createSubject);
router.route('/:id')
  .get(getSubjectById)
  .put(authorize('Admin'), updateSubject)
  .patch(authorize('Admin'), updateSubject)
  .delete(authorize('Admin'), deleteSubject);

module.exports = router;
