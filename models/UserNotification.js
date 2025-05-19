// models/UserNotification.js
const mongoose = require('mongoose');

const UserNotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  notificationType: String, // e.g., 'assignment', 'grade', 'announcement'
  relatedEntity: String, // e.g., 'courses', 'exams', 'attendance'
  relatedId: mongoose.Schema.Types.ObjectId, // ID of the related item
  isRead: {
    type: Boolean,
    default: false
  },
  isEmailSent: {
    type: Boolean,
    default: false
  },
  isSmsSent: {
    type: Boolean,
    default: false
  },
  readAt: Date
}, {
  timestamps: true
});

// Index for better performance on common queries
UserNotificationSchema.index({ user: 1, isRead: 1 });
UserNotificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('UserNotification', UserNotificationSchema);