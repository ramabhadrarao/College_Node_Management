// controllers/user.controller.js
const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const fileService = require('../services/fileService');
const emailService = require('../services/emailService');
const { generateRandomPassword } = require('../utils/helpers');

/**
 * Get all users with filtering and pagination
 * @route GET /api/users
 * @access Admin
 */
exports.getAllUsers = catchAsync(async (req, res, next) => {
  // Build filters
  const filter = {};
  
  // Filter by role if specified
  if (req.query.role) {
    const role = await Role.findOne({ name: req.query.role });
    if (role) {
      filter.roles = { $in: [role._id] };
    }
  }
  
  // Filter by status
  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === 'true';
  }
  
  // Filter by verification status
  if (req.query.isVerified !== undefined) {
    filter.isVerified = req.query.isVerified === 'true';
  }
  
  // Search by username or email
  if (req.query.search) {
    filter.$or = [
      { username: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } }
    ];
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  
  // Execute query
  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .populate('roles', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter)
  ]);
  
  res.status(200).json({
    status: 'success',
    results: users.length,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    },
    data: {
      users
    }
  });
});

/**
 * Get user by ID
 * @route GET /api/users/:id
 * @access Admin
 */
exports.getUserById = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('roles', 'name');
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

/**
 * Create new user
 * @route POST /api/users
 * @access Admin
 */
exports.createUser = catchAsync(async (req, res, next) => {
  const { username, email, roles, isActive } = req.body;
  
  // Check if user already exists
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    return next(new AppError('User with this email or username already exists', 400));
  }
  
  // Generate random password
  const password = generateRandomPassword();
  
  // Handle profile picture if provided
  let profilePicture = null;
  if (req.file) {
    profilePicture = await fileService.uploadFile(req.file, 'users/profile');
  }
  
  // Find role IDs if provided
  let roleIds = [];
  if (roles && Array.isArray(roles)) {
    const foundRoles = await Role.find({ name: { $in: roles } });
    roleIds = foundRoles.map(role => role._id);
  } else {
    // Default to Student role if none provided
    const defaultRole = await Role.findOne({ name: 'Student' });
    if (defaultRole) {
      roleIds = [defaultRole._id];
    }
  }
  
  // Create user
  const user = await User.create({
    username,
    email,
    password,
    roles: roleIds,
    isActive: isActive !== undefined ? isActive : true,
    profilePicture,
    createdBy: req.user.id
  });
  
  // Send welcome email with credentials
  await emailService.sendWelcomeEmail({
    email: user.email,
    name: user.username
  }, password);
  
  res.status(201).json({
    status: 'success',
    message: 'User created successfully. Credentials sent via email.',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        roles: roles || ['Student'],
        isActive: user.isActive
      }
    }
  });
});

/**
 * Update user
 * @route PATCH /api/users/:id
 * @access Admin
 */
exports.updateUser = catchAsync(async (req, res, next) => {
  const { username, email, roles, isActive, isVerified } = req.body;
  
  // Find user
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  // Update fields if provided
  if (username) user.username = username;
  if (email) user.email = email;
  if (isActive !== undefined) user.isActive = isActive;
  if (isVerified !== undefined) user.isVerified = isVerified;
  
  // Update roles if provided
  if (roles && Array.isArray(roles)) {
    const foundRoles = await Role.find({ name: { $in: roles } });
    user.roles = foundRoles.map(role => role._id);
  }
  
  // Handle profile picture if provided
  if (req.file) {
    // Delete old profile picture if exists
    if (user.profilePicture) {
      await fileService.deleteFile(user.profilePicture);
    }
    
    user.profilePicture = await fileService.uploadFile(req.file, 'users/profile');
  }
  
  // Save changes
  user.updatedBy = req.user.id;
  await user.save();
  
  res.status(200).json({
    status: 'success',
    message: 'User updated successfully',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        roles: (await Role.find({ _id: { $in: user.roles } })).map(role => role.name),
        isActive: user.isActive,
        isVerified: user.isVerified
      }
    }
  });
});

/**
 * Delete user
 * @route DELETE /api/users/:id
 * @access Admin
 */
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  // Delete profile picture if exists
  if (user.profilePicture) {
    await fileService.deleteFile(user.profilePicture);
  }
  
  await User.findByIdAndDelete(req.params.id);
  
  res.status(200).json({
    status: 'success',
    message: 'User deleted successfully',
    data: null
  });
});

/**
 * Reset user password
 * @route POST /api/users/:id/reset-password
 * @access Admin
 */
exports.resetUserPassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  // Generate new password
  const newPassword = generateRandomPassword();
  
  // Update user password
  user.password = newPassword;
  user.passwordChangedAt = Date.now();
  await user.save();
  
  // Send email with new password
  await emailService.sendPasswordResetEmail({
    email: user.email,
    name: user.username
  }, newPassword);
  
  res.status(200).json({
    status: 'success',
    message: 'Password reset successfully. New password sent via email.',
    data: null
  });
});

/**
 * Get user permissions
 * @route GET /api/users/:id/permissions
 * @access Admin
 */
exports.getUserPermissions = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).populate('roles');
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  // Get all permissions from user's roles
  const roleIds = user.roles.map(role => role._id);
  
  const roles = await Role.find({ _id: { $in: roleIds } }).populate('permissions');
  
  // Extract unique permissions
  const permissions = new Set();
  
  roles.forEach(role => {
    role.permissions.forEach(permission => {
      permissions.add({
        id: permission._id,
        name: permission.name,
        description: permission.description,
        module: permission.module
      });
    });
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      },
      roles: user.roles.map(role => ({
        id: role._id,
        name: role.name
      })),
      permissions: Array.from(permissions)
    }
  });
});

module.exports = exports;