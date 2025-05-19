// models/AttendanceBatchUpdate.js
const mongoose = require('mongoose');

const AttendanceBatchUpdateSchema = new mongoose.Schema({
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseSection'
  },
  attendanceDate: {
    type: Date,
    required: true
  },
  period: Number,
  totalRecords: {
    type: Number,
    default: 0
  },
  presentCount: {
    type: Number,
    default: 0
  },
  absentCount: {
    type: Number,
    default: 0
  },
  ipAddress: String
}, {
  timestamps: true
});

module.exports = mongoose.model('AttendanceBatchUpdate', AttendanceBatchUpdateSchema);
