const AppError = require('../utils/appError');
const { isValidObjectId } = require('../utils/validators');

// Use with router.param('id', validateObjectIdParam) to reject malformed ids with 400
const validateObjectIdParam = (req, res, next, value, name) => {
  if (!isValidObjectId(value)) {
    return next(new AppError(`Invalid ${name}: "${value}"`, 400));
  }
  next();
};

module.exports = { validateObjectIdParam };
