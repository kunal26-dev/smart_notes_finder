const express = require('express');
const { getProfile, updateProfile, getUserPublicProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { validateObjectIdParam } = require('../middleware/validateObjectId');

const router = express.Router();
router.param('id', validateObjectIdParam);
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/:id', getUserPublicProfile);

module.exports = router;
