const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Zod Validation Error
  if (err.name === 'ZodError') {
    const issues = err.issues || err.errors || [];
    const messages = issues.map((e) => `${e.path ? e.path.join('.') : 'Field'}: ${e.message}`);
    error = new AppError('Validation Error', 400);
    error.errors = messages;
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    error = new AppError('Database Validation Error', 400);
    error.errors = messages;
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new AppError(message, 404);
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate value entered for ${field}. Please use another value.`;
    error = new AppError(message, 400);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Please log in again.', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Your token has expired. Please log in again.', 401);
  }

  // Send Response
  const response = {
    success: false,
    message: error.message || 'Server Error',
  };

  if (error.errors) {
    response.errors = error.errors;
  }

  // Show stack in development only for unhandled errors without a known format, if you want.
  // The assignment says "Hide stack traces when NODE_ENV is production."
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.stack = err.stack;
  }

  res.status(error.statusCode).json(response);
};

module.exports = errorHandler;
