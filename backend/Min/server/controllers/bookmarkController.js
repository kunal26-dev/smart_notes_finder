const Bookmark = require('../models/Bookmark');
const Resource = require('../models/Resource');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { populateOptions } = require('../utils/resourceQuery');

// POST /api/bookmarks/:resourceId
const addBookmark = asyncHandler(async (req, res) => {
  const resource = await Resource.findOne({ _id: req.params.resourceId, status: 'Approved' });
  if (!resource) throw new AppError('Resource not found', 404);

  try {
    const bookmark = await Bookmark.create({ user: req.user._id, resource: resource._id });
    sendSuccess(res, 201, 'Bookmark added successfully', { bookmark });
  } catch (err) {
    if (err.code === 11000) throw new AppError('Resource is already bookmarked', 409);
    throw err;
  }
});

// DELETE /api/bookmarks/:resourceId
const removeBookmark = asyncHandler(async (req, res) => {
  const bookmark = await Bookmark.findOneAndDelete({ user: req.user._id, resource: req.params.resourceId });
  if (!bookmark) throw new AppError('Bookmark not found', 404);
  sendSuccess(res, 200, 'Bookmark removed successfully');
});

// GET /api/bookmarks  (only the logged-in user's bookmarks; hides resources that are no longer approved)
const getBookmarks = asyncHandler(async (req, res) => {
  const bookmarks = await Bookmark.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate({ path: 'resource', match: { status: 'Approved' }, populate: populateOptions(false) });

  const visible = bookmarks.filter((b) => b.resource);
  sendSuccess(res, 200, 'Bookmarks retrieved successfully', {
    count: visible.length,
    bookmarks: visible,
  });
});

module.exports = { addBookmark, removeBookmark, getBookmarks };
