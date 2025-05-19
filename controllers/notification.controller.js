// controllers/notification.controller.js
const notificationService = require('../services/notificationService');
const NotificationTemplate = require('../models/NotificationTemplate');
const User = require('../models/User');
const Role = require('../models/Role');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * Get user notifications with pagination
 * @route GET /api/notifications
 * @access Protected
 */
exports.getUserNotifications = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const unreadOnly = req.query.unreadOnly === 'true';
  
  const result = await notificationService.getUserNotifications(req.user.id, {
    page,
    limit,
    unreadOnly
  });
  
  res.status(200).json({
    status: 'success',
    results: result.notifications.length,
    pagination: result.pagination,
    data: {
      notifications: result.notifications
    }
  });
});

/**
 * Mark notifications as read
 * @route PATCH /api/notifications/read
 * @access Protected
 */
exports.markAsRead = catchAsync(async (req, res, next) => {
  const { notificationIds } = req.body;
  
  if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
    return next(new AppError('Notification IDs array is required', 400));
  }
  
  const markedCount = await notificationService.markNotificationsAsRead(req.user.id, notificationIds);
  
  res.status(200).json({
    status: 'success',
    message: `${markedCount} notification(s) marked as read`,
    data: {
      markedCount
    }
  });
});

/**
 * Mark all notifications as read
 * @route PATCH /api/notifications/read-all
 * @access Protected
 */
exports.markAllAsRead = catchAsync(async (req, res, next) => {
  const markedCount = await notificationService.markAllNotificationsAsRead(req.user.id);
  
  res.status(200).json({
    status: 'success',
    message: `${markedCount} notification(s) marked as read`,
    data: {
      markedCount
    }
  });
});

/**
 * Delete notifications
 * @route DELETE /api/notifications
 * @access Protected
 */
exports.deleteNotifications = catchAsync(async (req, res, next) => {
  const { notificationIds } = req.body;
  
  if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
    return next(new AppError('Notification IDs array is required', 400));
  }
  
  const deletedCount = await notificationService.deleteNotifications(req.user.id, notificationIds);
  
  res.status(200).json({
    status: 'success',
    message: `${deletedCount} notification(s) deleted`,
    data: {
      deletedCount
    }
  });
});

/**
 * Get unread notifications count
 * @route GET /api/notifications/unread-count
 * @access Protected
 */
exports.getUnreadCount = catchAsync(async (req, res, next) => {
  const count = await notificationService.getUnreadNotificationsCount(req.user.id);
  
  res.status(200).json({
    status: 'success',
    data: {
      unreadCount: count
    }
  });
});

/**
 * Get notification templates
 * @route GET /api/admin/notifications/templates
 * @access Admin
 */
exports.getNotificationTemplates = catchAsync(async (req, res, next) => {
  const templates = await NotificationTemplate.find();
  
  res.status(200).json({
    status: 'success',
    results: templates.length,
    data: {
      templates
    }
  });
});

/**
 * Create notification template
 * @route POST /api/admin/notifications/templates
 * @access Admin
 */
exports.createNotificationTemplate = catchAsync(async (req, res, next) => {
  const { templateName, templateCode, subject, body, variables, smsTemplate } = req.body;
  
  // Check if template code already exists
  const existingTemplate = await NotificationTemplate.findOne({ templateCode });
  if (existingTemplate) {
    return next(new AppError('Template code already exists', 400));
  }
  
  const template = await NotificationTemplate.create({
    templateName,
    templateCode,
    subject,
    body,
    variables: variables || JSON.stringify([]),
    smsTemplate: smsTemplate || ''
  });
  
  res.status(201).json({
    status: 'success',
    message: 'Notification template created successfully',
    data: {
      template
    }
  });
});

/**
 * Update notification template
 * @route PUT /api/admin/notifications/templates/:id
 * @access Admin
 */
exports.updateNotificationTemplate = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { templateName, subject, body, variables, smsTemplate } = req.body;
  
  const template = await NotificationTemplate.findByIdAndUpdate(
    id,
    {
      templateName,
      subject,
      body,
      variables: variables || undefined,
      smsTemplate: smsTemplate || undefined
    },
    { new: true, runValidators: true }
  );
  
  if (!template) {
    return next(new AppError('Template not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Notification template updated successfully',
    data: {
      template
    }
  });
});

/**
 * Delete notification template
 * @route DELETE /api/admin/notifications/templates/:id
 * @access Admin
 */
exports.deleteNotificationTemplate = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const template = await NotificationTemplate.findByIdAndDelete(id);
  
  if (!template) {
    return next(new AppError('Template not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Notification template deleted successfully',
    data: null
  });
});

/**
 * Send bulk notification
 * @route POST /api/admin/notifications/bulk
 * @access Admin
 */
exports.sendBulkNotification = catchAsync(async (req, res, next) => {
  const { title, message, targetType, targetId, sendEmail = false } = req.body;
  
  let userIds = [];
  
  // Get target users based on target type
  switch (targetType) {
    case 'all':
      // Get all active users
      const allUsers = await User.find({ isActive: true });
      userIds = allUsers.map(user => user._id);
      break;
      
    case 'role':
      // Get users with specific role
      if (!targetId) {
        return next(new AppError('Target ID (role ID) is required', 400));
      }
      
      const usersWithRole = await User.find({
        roles: targetId,
        isActive: true
      });
      
      userIds = usersWithRole.map(user => user._id);
      break;
      
    case 'department':
      // Get faculty and students in department
      if (!targetId) {
        return next(new AppError('Target ID (department ID) is required', 400));
      }
      
      // Get faculty in department
      const facultyInDepartment = await Faculty.find({
        department: targetId,
        status: 'active'
      });
      
      const facultyUserIds = facultyInDepartment.map(faculty => faculty.user);
      
      // Get students in department's programs
      const programsInDepartment = await Program.find({
        department: targetId
      });
      
      const programIds = programsInDepartment.map(program => program._id);
      
      const studentsInPrograms = await Student.find({
        program: { $in: programIds },
        status: 'active'
      });
      
      const studentUserIds = studentsInPrograms.map(student => student.user);
      
      userIds = [...facultyUserIds, ...studentUserIds];
      break;
      
    case 'batch':
      // Get students in batch
      if (!targetId) {
        return next(new AppError('Target ID (batch ID) is required', 400));
      }
      
      const studentsInBatch = await Student.find({
        batch: targetId,
        status: 'active'
      });
      
      userIds = studentsInBatch.map(student => student.user);
      break;
      
    default:
      return next(new AppError('Invalid target type', 400));
  }
  
  if (userIds.length === 0) {
    return next(new AppError('No users found for the target criteria', 404));
  }
  
  // Send notifications
  const notifications = await notificationService.createBulkNotifications(
    userIds,
    {
      title,
      message,
      type: 'admin',
      relatedEntity: 'notification',
      relatedId: null
    },
    sendEmail
  );
  
  res.status(200).json({
    status: 'success',
    message: `${notifications.length} notification(s) sent successfully`,
    data: {
      sentCount: notifications.length,
      targetUsers: userIds.length
    }
  });
});

module.exports = exports;