const AppError = require('../utils/appError');

// Usage: authorize('Admin') or authorize('Student', 'Teacher')
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(new AppError('Not authorized.', 401));
  if (!roles.includes(req.user.role)) {
    return next(new AppError(`Access denied. ${roles.join(' / ')} role required.`, 403));
  }
  next();
};

module.exports = { authorize };
