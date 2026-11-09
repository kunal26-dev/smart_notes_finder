const User = require('../models/User');
const Resource = require('../models/Resource');
const Subject = require('../models/Subject');
const Category = require('../models/Category');
const Bookmark = require('../models/Bookmark');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { populateOptions } = require('../utils/resourceQuery');

// GET /api/dashboard  (any logged-in user)
const getUserDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [
    totalApproved,
    recentResources,
    myRecentResources,
    myStatusCounts,
    bookmarkCount,
    recentBookmarks,
    subjects,
    categories,
    byCategory,
    byFileType,
  ] = await Promise.all([
    Resource.countDocuments({ status: 'Approved' }),
    Resource.find({ status: 'Approved' }).sort({ createdAt: -1 }).limit(5).populate(populateOptions(false)),
    Resource.find({ uploadedBy: userId }).sort({ createdAt: -1 }).limit(5).populate(populateOptions(false)),
    Resource.aggregate([{ $match: { uploadedBy: userId } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Bookmark.countDocuments({ user: userId }),
    Bookmark.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({ path: 'resource', match: { status: 'Approved' }, populate: populateOptions(false) }),
    Subject.find().sort({ subjectName: 1 }),
    Category.find().sort({ categoryName: 1 }),
    Resource.aggregate([
      { $match: { status: 'Approved' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $project: { _id: 0, categoryId: '$_id', categoryName: '$category.categoryName', count: 1 } },
      { $sort: { count: -1 } },
    ]),
    Resource.aggregate([
      { $match: { status: 'Approved' } },
      { $group: { _id: '$fileType', count: { $sum: 1 } } },
      { $project: { _id: 0, fileType: '$_id', count: 1 } },
      { $sort: { count: -1 } },
    ]),
  ]);

  const mine = { total: 0, Pending: 0, Approved: 0, Rejected: 0 };
  myStatusCounts.forEach((s) => {
    mine[s._id] = s.count;
    mine.total += s.count;
  });

  sendSuccess(res, 200, 'Dashboard data retrieved successfully', {
    totalApprovedResources: totalApproved,
    recentResources,
    myUploads: { counts: mine, recent: myRecentResources },
    bookmarks: { count: bookmarkCount, recent: recentBookmarks.filter((b) => b.resource) },
    subjects,
    categories,
    statistics: { resourcesByCategory: byCategory, resourcesByFileType: byFileType },
  });
});

// GET /api/dashboard/admin  (admin only; also at /api/admin/dashboard)
const getAdminDashboard = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalStudents,
    totalTeachers,
    totalAdmins,
    inactiveUsers,
    totalResources,
    approvedResources,
    pendingResources,
    rejectedResources,
    totalSubjects,
    totalCategories,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'Student' }),
    User.countDocuments({ role: 'Teacher' }),
    User.countDocuments({ role: 'Admin' }),
    User.countDocuments({ accountStatus: 'Inactive' }),
    Resource.countDocuments(),
    Resource.countDocuments({ status: 'Approved' }),
    Resource.countDocuments({ status: 'Pending' }),
    Resource.countDocuments({ status: 'Rejected' }),
    Subject.countDocuments(),
    Category.countDocuments(),
  ]);

  sendSuccess(res, 200, 'Admin dashboard statistics retrieved successfully', {
    users: { total: totalUsers, students: totalStudents, teachers: totalTeachers, admins: totalAdmins, inactive: inactiveUsers },
    resources: { total: totalResources, approved: approvedResources, pending: pendingResources, rejected: rejectedResources },
    totalSubjects,
    totalCategories,
  });
});

module.exports = { getUserDashboard, getAdminDashboard };
