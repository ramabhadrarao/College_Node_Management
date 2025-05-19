// models/AttendanceException.js
const mongoose = require('mongoose');

const AttendanceExceptionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
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
  exceptionDate: {
    type: Date,
    required: true
  },
  exceptionType: {
    type: String,
    enum: ['excused', 'medical', 'official', 'other'],
    required: true
  },
  authorizedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  proofAttachment: String,
  reason: String
}, {
  timestamps: true
});

module.exports = mongoose.model('AttendanceException', AttendanceExceptionSchema);