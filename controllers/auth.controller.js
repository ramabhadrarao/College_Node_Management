// controllers/auth.controller.js
const crypto = require('crypto');
const { promisify } = require('util');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/User');
const Role = require('../models/Role');
const tokenService = require('../services/tokenService');
const emailService = require('../services/emailService');
const config = require('../config/config');

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
exports.register = catchAsync(async (req, res, next) => {
  // 1) Check if user already exists
  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    return next(new AppError('Email already in use', 400));
  }

  // 2) Create a new user
  const user = await User.create({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password
  });

  // 3) Assign default role (e.g., 'Student')
  const defaultRole = await Role.findOne({ name: 'Student' });
  if (defaultRole) {
    user.roles = [defaultRole._id];
    await user.save();
  }

  // 4) Send welcome email
  await emailService.sendWelcomeEmail(user, req.body.password);

  // 5) Generate token
  const token = tokenService.generateAuthToken(user._id);

  // 6) Send response
  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    }
  });
});

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2) Check if user exists & password is correct
  const user = await User.findOne({ email }).select('+password');
  
  if (!user || !(await user.comparePassword(password))) {
    // Increment failed login attempts
    if (user) {
      user.failedLoginAttempts += 1;
      
      // Lock account after 5 failed attempts
      if (user.failedLoginAttempts >= 5) {
        user.lockoutUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
      }
      
      await user.save({ validateBeforeSave: false });
    }
    
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) Check if user is locked out
  if (user.lockoutUntil && user.lockoutUntil > Date.now()) {
    return next(new AppError('Account locked due to multiple failed attempts. Try again later.', 401));
  }

  // 4) Check if user is verified and active
  if (!user.isVerified) {
    return next(new AppError('Please verify your email address', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated', 401));
  }

  // 5) Reset failed login attempts
  user.failedLoginAttempts = 0;
  user.lockoutUntil = null;
  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  // 6) Generate token
  const token = tokenService.generateAuthToken(user._id);

  // 7) Send response
  res.status(200).json({
    status: 'success',
    token,
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    }
  });
});

/**
 * Logout user
 * @route GET /api/auth/logout
 * @access Protected
 */
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({ status: 'success' });
};

/**
 * Forgot password
 * @route POST /api/auth/forgot-password
 * @access Public
 */
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No user found with that email address', 404));
  }

  // 2) Generate random reset token
  const resetToken = await tokenService.generatePasswordResetToken(user);

  // 3) Send it to user's email
  try {
    await emailService.sendPasswordResetEmail(user, resetToken);

    res.status(200).json({
      status: 'success',
      message: 'Password reset token sent to email'
    });
  } catch (err) {
    // If there's an error sending email, clear the reset token
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('Error sending email. Please try again later.', 500));
  }
});

/**
 * Reset password
 * @route PATCH /api/auth/reset-password/:token
 * @access Public
 */
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Verify token and get user
  const user = await tokenService.verifyPasswordResetToken(req.params.token);
  
  if (!user) {
    return next(new AppError('Invalid or expired token', 400));
  }

  // 2) Set new password
  user.password = req.body.password;
  
  // 3) Clear reset token
  await tokenService.clearPasswordResetToken(user);

  // 4) Update passwordChangedAt property
  user.passwordChangedAt = Date.now();
  await user.save();

  // 5) Log the user in, send JWT
  const token = tokenService.generateAuthToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
    message: 'Password has been reset successfully'
  });
});

/**
 * Update current user password
 * @route PATCH /api/auth/update-password
 * @access Protected
 */
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if current password is correct
  if (!(await user.comparePassword(req.body.currentPassword))) {
    return next(new AppError('Your current password is incorrect', 401));
  }

  // 3) Update password
  user.password = req.body.newPassword;
  user.passwordChangedAt = Date.now();
  await user.save();

  // 4) Log user in, send JWT
  const token = tokenService.generateAuthToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
    message: 'Password updated successfully'
  });
});

/**
 * Get current logged in user
 * @route GET /api/auth/me
 * @access Protected
 */
exports.getCurrentUser = catchAsync(async (req, res, next) => {
  // User is already available on req object from auth middleware
  const user = await User.findById(req.user.id).populate('roles');

  // Get permissions from roles
  const roleIds = user.roles.map(role => role._id);
  const roles = await Role.find({ _id: { $in: roleIds } }).populate('permissions');
  
  // Extract permissions
  const permissions = new Set();
  roles.forEach(role => {
    role.permissions.forEach(permission => {
      permissions.add(permission.name);
    });
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        roles: user.roles.map(role => role.name),
        permissions: Array.from(permissions),
        isActive: user.isActive,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    }
  });
});

/**
 * Verify email with token
 * @route GET /api/auth/verify-email/:token
 * @access Public
 */
exports.verifyEmail = catchAsync(async (req, res, next) => {
  // 1) Hash the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // 2) Find the user with the token
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });

  // 3) If token has expired or invalid, return error
  if (!user) {
    return next(new AppError('Invalid or expired verification token', 400));
  }

  // 4) Activate the user
  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  // 5) Log the user in, send JWT
  const token = tokenService.generateAuthToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
    message: 'Email verified successfully'
  });
});