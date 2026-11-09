const express = require('express');
const { addBookmark, removeBookmark, getBookmarks } = require('../controllers/bookmarkController');
const { protect } = require('../middleware/authMiddleware');
const { validateObjectIdParam } = require('../middleware/validateObjectId');

const router = express.Router();
router.param('resourceId', validateObjectIdParam);
router.use(protect);

router.get('/', getBookmarks);
router.post('/:resourceId', addBookmark);
router.delete('/:resourceId', removeBookmark);

module.exports = router;
