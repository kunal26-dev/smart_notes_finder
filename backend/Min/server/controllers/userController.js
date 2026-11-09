const User = require('../models/User');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { isValidEmail, isString } = require('../utils/validators');

// Validates profile fields shared by the user and admin update endpoints
const applyProfileUpdates = async (user, body) => {
  const errors = [];

  if (body.name !== undefined) {
    if (!isString(body.name) || body.name.trim().length < 2) errors.push('Name must be at least 2 characters');
    else user.name = body.name;
  }
  if (body.email !== undefined) {
    if (!isValidEmail(body.email)) errors.push('A valid email is required');
    else {
      const email = body.email.trim().toLowerCase();
      if (email !== user.email) {
        if (await User.exists({ email, _id: { $ne: user._id } })) {
          throw new AppError('An account with this email already exists', 409);
        }
        user.email = email;
      }
    }
  }
  if (body.bio !== undefined) {
    if (!isString(body.bio)) errors.push('Bio must be text');
    else user.bio = body.bio;
  }
  if (body.profileImage !== undefined) {
    if (!isString(body.profileImage)) errors.push('Profile image must be a URL string');
    else user.profileImage = body.profileImage;
  }

  if (errors.length) throw new AppError('Validation failed', 400, errors);
  return user;
};

// GET /api/users/profile
const getProfile = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, 'Profile retrieved', { user: req.user });
});

// PUT /api/users/profile  (name, email, bio, profileImage only: role/status cannot be changed here)
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  await applyProfileUpdates(user, req.body);
  await user.save();
  sendSuccess(res, 200, 'Profile updated successfully', { user });
});

// GET /api/users/:id  (basic public info about another user)
const getUserPublicProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, accountStatus: 'Active' }).select(
    'name role bio profileImage createdAt'
  );
  if (!user) throw new AppError('User not found', 404);
  sendSuccess(res, 200, 'User retrieved', { user });
});

module.exports = { getProfile, updateProfile, getUserPublicProfile, applyProfileUpdates };
