// routes/admin.routes.js
const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backup.controller');
const notificationController = require('../controllers/notification.controller');
const systemController = require('../controllers/system.controller');
const { protect, restrictTo, hasPermission } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validator');

// All routes require admin privileges
router.use(protect);
router.use(restrictTo('Admin'));

// Backup routes
router.get('/backups', backupController.listBackups);
router.post('/backups', backupController.createBackup);
router.post('/backups/:filename/restore', backupController.restoreBackup);
router.delete('/backups/:filename', backupController.deleteBackup);

// System settings routes
router.get('/settings', systemController.getSettings);
router.put('/settings/:key', 
  validateBody([
    'setting_value' 
  ]), 
  systemController.updateSetting
);

// Notification templates routes
router.get('/notifications/templates', notificationController.getNotificationTemplates);
router.post('/notifications/templates', 
  validateBody([
    'templateName',
    'templateCode',
    'subject',
    'body' 
  ]), 
  notificationController.createNotificationTemplate
);
router.put('/notifications/templates/:id', 
  validateBody([
    'templateName',
    'subject',
    'body' 
  ]), 
  notificationController.updateNotificationTemplate
);
router.delete('/notifications/templates/:id', notificationController.deleteNotificationTemplate);

// Bulk notification routes
router.post('/notifications/bulk', 
  validateBody([
    'title',
    'message',
    'targetType',
    'targetId',
    'sendEmail' 
  ]), 
  notificationController.sendBulkNotification
);

module.exports = router;