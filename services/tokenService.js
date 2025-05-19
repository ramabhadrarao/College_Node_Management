// services/tokenService.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/config');
const User = require('../models/User');

/**
 * Generate JWT token for authentication
 * @param {string} userId - User ID
 * @returns {string} - JWT token
 */
const generateAuthToken = (userId) => {
  return jwt.sign({ id: userId }, config.app.jwtSecret, {
    expiresIn: config.app.jwtExpiresIn
  });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} - Decoded token or null if invalid
 */
const verifyAuthToken = (token) => {
  try {
    return jwt.verify(token, config.app.jwtSecret);
  } catch (error) {
    return null;
  }
};

/**
 * Generate password reset token
 * @param {Object} user - User document from database
 * @returns {string} - Reset token
 */
const generatePasswordResetToken = async (user) => {
  // Generate random reset token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token and save to user document
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Save hashed token to user
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = Date.now() + 3600000; // 1 hour
  await user.save({ validateBeforeSave: false });

  return resetToken;
};

/**
 * Verify password reset token
 * @param {string} token - Reset token
 * @returns {Promise<User|null>} - User document or null if token is invalid
 */
const verifyPasswordResetToken = async (token) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user with the token and check if token is still valid
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  return user;
};

/**
 * Clear password reset token after it's been used
 * @param {Object} user - User document
 * @returns {Promise<void>}
 */
const clearPasswordResetToken = async (user) => {
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save({ validateBeforeSave: false });
};

module.exports = {
  generateAuthToken,
  verifyAuthToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  clearPasswordResetToken
};