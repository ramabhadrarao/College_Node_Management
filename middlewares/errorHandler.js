// middlewares/errorHandler.js
const config = require('../config/config');
const logger = require('../utils/logger');
const AppError = require('../utils/appError');

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode || 500
  });

  // Set default error properties
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Different error responses based on environment
  if (config.app.nodeEnv === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Mongoose validation error
    if (err.name === 'ValidationError') {
      error = handleValidationError(err);
    }
    
    // Mongoose duplicate key error
    if (err.code === 11000) {
      error = handleDuplicateFieldsError(err);
    }
    
    // Mongoose cast error
    if (err.name === 'CastError') {
      error = handleCastError(err);
    }
    
    // JSON Web Token error
    if (err.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }
    
    // JWT expired error
    if (err.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }

    sendErrorProd(error, res);
  }
};

// Send detailed error in development
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

// Send cleaner error in production
const sendErrorProd = (err, res) => {
  // Operational error: trusted error, send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } 
  // Programming error: don't leak details to client
  else {
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
  }
};

// Handle specific error types
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsError = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401);

module.exports = errorHandler;