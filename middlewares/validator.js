// middlewares/validator.js
const { validationResult } = require('express-validator');
const AppError = require('../utils/appError');

/**
 * Middleware to validate request body using express-validator
 * @param {Array} validations - Array of express-validator validation middleware
 * @returns {Function} - Express middleware
 */
exports.validateBody = (validations) => {
  return async (req, res, next) => {
    try {
      // Execute all validations
      await Promise.all(validations.map(validation => validation.run(req)));

      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }));

        return next(new AppError('Validation error', 400, errorMessages));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};