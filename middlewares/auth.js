// middlewares/auth.js
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const tokenService = require('../services/tokenService');
const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const AccessPolicyDecision = require('../models/AccessPolicyDecision');

/**
 * Protect routes - Verify user is authenticated
 */
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Get token from header or cookies
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }

  // 2) Verify token
  const decoded = tokenService.verifyAuthToken(token);
  if (!decoded) {
    return next(new AppError('Invalid token or token expired. Please log in again.', 401));
  }

  // 3) Check if user still exists
  const user = await User.findById(decoded.id).select('+password');
  if (!user) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // 4) Check if user changed password after the token was issued
  if (user.passwordChangedAt) {
    const changedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
    if (decoded.iat < changedTimestamp) {
      return next(new AppError('User recently changed password. Please log in again.', 401));
    }
  }

  // 5) Check if user is active
  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated. Please contact support.', 401));
  }

  // If everything ok, save user to request object
  req.user = user;
  next();
});

/**
 * Restrict to certain roles
 * @param {...string} roles - Roles allowed to access the route
 * @returns {Function} - Express middleware
 */
exports.restrictTo = (...roles) => {
  return catchAsync(async (req, res, next) => {
    // Get user roles
    const userRoles = await Role.find({ _id: { $in: req.user.roles } });
    const roleNames = userRoles.map(role => role.name);
    
    // Check if user has any of the required roles
    const hasRole = roles.some(role => roleNames.includes(role));
    
    if (!hasRole) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    
    next();
  });
};

/**
 * Check if user has specific permission
 * @param {string} permissionName - Permission name to check
 * @returns {Function} - Express middleware
 */
exports.hasPermission = (permissionName) => {
  return catchAsync(async (req, res, next) => {
    // Get user roles
    const userRoles = await Role.find({ _id: { $in: req.user.roles } });
    
    // Get permissions from roles
    let hasPermission = false;
    
    for (const role of userRoles) {
      // Find role with permissions populated
      const populatedRole = await Role.findById(role._id).populate('permissions');
      
      // Check if role has the required permission
      if (populatedRole.permissions.some(p => p.name === permissionName)) {
        hasPermission = true;
        break;
      }
    }
    
    if (!hasPermission) {
      return next(new AppError(`You don't have '${permissionName}' permission`, 403));
    }
    
    next();
  });
};

/**
 * Check access to resource based on attribute-based conditions
 * @param {string} permissionName - Permission name
 * @param {string} resourceType - Type of resource (e.g., 'course', 'student')
 * @param {string} resourceIdParam - Request parameter containing resource ID
 * @returns {Function} - Express middleware
 */
exports.checkResourceAccess = (permissionName, resourceType, resourceIdParam) => {
  return catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const resourceId = req.params[resourceIdParam];
    
    if (!resourceId) {
      return next(new AppError(`Resource ID parameter '${resourceIdParam}' not found`, 400));
    }
    
    // First check cached decisions
    const cachedDecision = await AccessPolicyDecision.findOne({
      user: userId,
      resourceType,
      resourceId,
      permission: permissionName,
      expiryTimestamp: { $gt: new Date() }
    });
    
    if (cachedDecision) {
      if (!cachedDecision.isAllowed) {
        return next(new AppError(`Access denied: ${cachedDecision.decisionReason || 'Insufficient permissions'}`, 403));
      }
      return next();
    }
    
    // If not in cache, evaluate permission
    // This is a simplified version - in a real system you'd implement the full ABAC logic here
    // For example, checking if faculty is assigned to a course, student is enrolled, etc.
    
    // Get user attributes
    const user = await User.findById(userId);
    const attributes = user.attributes || [];
    
    // Get permissions with resource conditions
    const permission = await Permission.findOne({ name: permissionName });
    if (!permission) {
      return next(new AppError(`Permission '${permissionName}' not found`, 500));
    }
    
    // Example condition: Faculty member accessing their assigned section
    let isAllowed = false;
    let decisionReason = '';
    
    // Simple example for faculty course access
    if (resourceType === 'section' && permissionName === 'attendance_mark') {
      // Check if user has faculty_id attribute
      const facultyIdAttr = attributes.find(attr => attr.name === 'faculty_id');
      
      if (facultyIdAttr) {
        // In a real system, you'd check the faculty_section_assignments collection
        // This is a simplified check
        isAllowed = true; // Assume allowed for demo
      } else {
        decisionReason = 'User is not a faculty member';
      }
    }
    
    // Cache the decision
    await AccessPolicyDecision.create({
      user: userId,
      resourceType,
      resourceId,
      permission: permissionName,
      isAllowed,
      decisionReason,
      expiryTimestamp: new Date(Date.now() + 3600000) // 1 hour
    });
    
    if (!isAllowed) {
      return next(new AppError(`Access denied: ${decisionReason || 'Insufficient permissions'}`, 403));
    }
    
    next();
  });
};