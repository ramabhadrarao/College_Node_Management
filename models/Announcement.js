// models/Announcement.js
const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetType: {
    type: String,
    enum: ['all', 'college', 'department', 'program', 'branch', 'batch', 'course', 'faculty', 'student'],
    required: true
  },
  targetId: mongoose.Schema.Types.ObjectId, // ID of the target entity (null for 'all')
  startDate: Date,
  endDate: Date,
  attachment: String,
  isImportant: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Announcement', AnnouncementSchema);