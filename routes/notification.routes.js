// Fixed routes/notification.routes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { protect } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validator');
const { body } = require('express-validator');

// All routes require authentication
router.use(protect);

// Get user notifications
router.get('/', notificationController.getUserNotifications);

// Mark notifications as read
router.patch('/read', 
  validateBody([
    body('notificationIds').isArray().withMessage('Notification IDs must be an array')
  ]), 
  notificationController.markAsRead
);

// Mark all notifications as read
router.patch('/read-all', notificationController.markAllAsRead);

// Delete notifications
router.delete('/', 
  validateBody([
    body('notificationIds').isArray().withMessage('Notification IDs must be an array')
  ]), 
  notificationController.deleteNotifications
);

// Get unread count
router.get('/unread-count', notificationController.getUnreadCount);

module.exports = router;