const multer = require('multer');
const AppError = require('../utils/appError');

const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

// Centralized error handler. Always responds with { success: false, message }
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors;

  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: "${err.value}"`;
  } else if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    errors = Object.values(err.errors).map((e) => e.message);
    message = 'Validation failed';
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field';
    message = `A record with this ${field} already exists`;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please log in again.';
  } else if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') message = 'File is too large. Please upload a smaller file.';
    else if (err.code === 'LIMIT_UNEXPECTED_FILE') message = 'Unexpected file field. Use the field name "file".';
    else message = `File upload error: ${err.message}`;
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON in request body';
  } else if (err.name === 'MongoServerSelectionError' || err.name === 'MongoNetworkError') {
    statusCode = 500;
    message = 'Database connection error';
  }

  if (statusCode >= 500) {
    console.error(err);
    if (process.env.NODE_ENV === 'production' && !err.isOperational) {
      message = 'Internal server error';
    }
  }

  const body = { success: false, message };
  if (errors && errors.length) body.errors = errors;
  if (process.env.NODE_ENV !== 'production' && statusCode >= 500) body.stack = err.stack;

  res.status(statusCode).json(body);
};

module.exports = { notFound, errorHandler };
