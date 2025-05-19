// services/notificationService.js
const User = require('../models/User');
const UserNotification = require('../models/UserNotification');
const NotificationTemplate = require('../models/NotificationTemplate');
const emailService = require('./emailService');
const logger = require('../utils/logger');

/**
 * Create a notification for a user
 * @param {Object} options - Notification options
 * @param {string} options.userId - User ID
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {string} options.type - Notification type
 * @param {string} [options.relatedEntity] - Related entity type
 * @param {string} [options.relatedId] - Related entity ID
 * @param {boolean} [options.sendEmail=false] - Whether to send email
 * @returns {Promise<Object>} - Created notification
 */
const createNotification = async (options) => {
  try {
    const { userId, title, message, type, relatedEntity, relatedId, sendEmail = false } = options;
    
    // Create notification in database
    const notification = await UserNotification.create({
      user: userId,
      title,
      message,
      notificationType: type,
      relatedEntity,
      relatedId
    });
    
    // Send email if requested
    if (sendEmail) {
      try {
        const user = await User.findById(userId);
        
        if (user && user.email) {
          await emailService.sendNotificationEmail({
            user,
            subject: title,
            message,
            data: {
              notificationType: type,
              title,
              message
            }
          });
          
          // Update notification to mark email as sent
          notification.isEmailSent = true;
          await notification.save();
        }
      } catch (emailError) {
        logger.error('Error sending notification email:', emailError);
      }
    }
    
    return notification;
  } catch (error) {
    logger.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create notifications for multiple users
 * @param {Array} userIds - Array of user IDs
 * @param {Object} notificationData - Notification data
 * @param {boolean} [sendEmail=false] - Whether to send email
 * @returns {Promise<Array>} - Created notifications
 */
const createBulkNotifications = async (userIds, notificationData, sendEmail = false) => {
  try {
    const notifications = [];
    
    for (const userId of userIds) {
      try {
        const notification = await createNotification({
          userId,
          ...notificationData,
          sendEmail
        });
        
        notifications.push(notification);
      } catch (error) {
        logger.error(`Error creating notification for user ${userId}:`, error);
      }
    }
    
    return notifications;
  } catch (error) {
    logger.error('Error creating bulk notifications:', error);
    throw error;
  }
};

/**
 * Create notifications for users based on roles
 * @param {Array} roles - Array of role names
 * @param {Object} notificationData - Notification data
 * @param {boolean} [sendEmail=false] - Whether to send email
 * @returns {Promise<Array>} - Created notifications
 */
const notifyUsersByRoles = async (roles, notificationData, sendEmail = false) => {
  try {
    // Find users with the specified roles
    const users = await User.find({
      'roles.name': { $in: roles },
      isActive: true
    });
    
    const userIds = users.map(user => user._id);
    return await createBulkNotifications(userIds, notificationData, sendEmail);
  } catch (error) {
    logger.error('Error notifying users by roles:', error);
    throw error;
  }
};

/**
 * Create notifications for all users
 * @param {Object} notificationData - Notification data
 * @param {boolean} [sendEmail=false] - Whether to send email
 * @returns {Promise<Array>} - Created notifications
 */
const notifyAllUsers = async (notificationData, sendEmail = false) => {
  try {
    // Find all active users
    const users = await User.find({ isActive: true });
    
    const userIds = users.map(user => user._id);
    return await createBulkNotifications(userIds, notificationData, sendEmail);
  } catch (error) {
    logger.error('Error notifying all users:', error);
    throw error;
  }
};

/**
 * Create notification based on template
 * @param {Object} options - Notification options
 * @param {string} options.userId - User ID
 * @param {string} options.templateCode - Template code
 * @param {Object} options.templateData - Data for template
 * @param {string} [options.relatedEntity] - Related entity type
 * @param {string} [options.relatedId] - Related entity ID
 * @param {boolean} [options.sendEmail=false] - Whether to send email
 * @returns {Promise<Object>} - Created notification
 */
const createNotificationFromTemplate = async (options) => {
  try {
    const { userId, templateCode, templateData, relatedEntity, relatedId, sendEmail = false } = options;
    
    // Find template
    const template = await NotificationTemplate.findOne({ templateCode, isActive: true });
    
    if (!template) {
      throw new Error(`Template not found: ${templateCode}`);
    }
    
    // Compile template
    const subject = compileTemplate(template.subject, templateData);
    const message = compileTemplate(template.body, templateData);
    
    // Create notification
    return await createNotification({
      userId,
      title: subject,
      message,
      type: templateCode,
      relatedEntity,
      relatedId,
      sendEmail
    });
  } catch (error) {
    logger.error('Error creating notification from template:', error);
    throw error;
  }
};

/**
 * Mark notifications as read
 * @param {string} userId - User ID
 * @param {Array} notificationIds - Array of notification IDs to mark as read
 * @returns {Promise<number>} - Number of notifications marked as read
 */
const markNotificationsAsRead = async (userId, notificationIds) => {
  try {
    const result = await UserNotification.updateMany(
      {
        _id: { $in: notificationIds },
        user: userId,
        isRead: false
      },
      {
        $set: { isRead: true, readAt: new Date() }
      }
    );
    
    return result.nModified;
  } catch (error) {
    logger.error('Error marking notifications as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Number of notifications marked as read
 */
const markAllNotificationsAsRead = async (userId) => {
  try {
    const result = await UserNotification.updateMany(
      {
        user: userId,
        isRead: false
      },
      {
        $set: { isRead: true, readAt: new Date() }
      }
    );
    
    return result.nModified;
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete notifications
 * @param {string} userId - User ID
 * @param {Array} notificationIds - Array of notification IDs to delete
 * @returns {Promise<number>} - Number of notifications deleted
 */
const deleteNotifications = async (userId, notificationIds) => {
  try {
    const result = await UserNotification.deleteMany({
      _id: { $in: notificationIds },
      user: userId
    });
    
    return result.deletedCount;
  } catch (error) {
    logger.error('Error deleting notifications:', error);
    throw error;
  }
};

/**
 * Get unread notifications count for user
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Unread notifications count
 */
const getUnreadNotificationsCount = async (userId) => {
  try {
    return await UserNotification.countDocuments({
      user: userId,
      isRead: false
    });
  } catch (error) {
    logger.error('Error getting unread notifications count:', error);
    throw error;
  }
};

/**
 * Get notifications for user with pagination
 * @param {string} userId - User ID
 * @param {Object} options - Pagination options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Page size
 * @param {boolean} [options.unreadOnly=false] - Get only unread notifications
 * @returns {Promise<Object>} - Paginated notifications
 */
const getUserNotifications = async (userId, options = {}) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = options;
    
    const query = { user: userId };
    
    if (unreadOnly) {
      query.isRead = false;
    }
    
    const skip = (page - 1) * limit;
    
    const [notifications, total] = await Promise.all([
      UserNotification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      UserNotification.countDocuments(query)
    ]);
    
    return {
      notifications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error getting user notifications:', error);
    throw error;
  }
};

/**
 * Compile template with variables
 * @param {string} template - Template string
 * @param {Object} data - Data for template variables
 * @returns {string} - Compiled template
 */
const compileTemplate = (template, data) => {
  return template.replace(/\{\{([^{}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    return data[trimmedKey] !== undefined ? data[trimmedKey] : match;
  });
};

module.exports = {
  createNotification,
  createBulkNotifications,
  notifyUsersByRoles,
  notifyAllUsers,
  createNotificationFromTemplate,
  markNotificationsAsRead,
  markAllNotificationsAsRead,
  deleteNotifications,
  getUnreadNotificationsCount,
  getUserNotifications
};