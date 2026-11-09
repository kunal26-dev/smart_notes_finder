const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

// Verifies the Bearer token and attaches the current user to req.user
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    throw new AppError('Not authorized. Please log in to access this resource.', 401);
  }
  const token = header.split(' ')[1];
  if (!token) throw new AppError('Not authorized. Token is missing.', 401);

  // Throws JsonWebTokenError / TokenExpiredError, handled in errorMiddleware
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id);
  if (!user) throw new AppError('The account for this token no longer exists.', 401);
  if (user.accountStatus !== 'Active') {
    throw new AppError('Your account has been deactivated. Please contact the administrator.', 403);
  }

  req.user = user;
  next();
});

module.exports = { protect };
