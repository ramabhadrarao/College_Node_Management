// models/AttendanceSummary.js (Missing from previous implementation)
const mongoose = require('mongoose');

const AttendanceSummarySchema = new mongoose.Schema({
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
    ref: 'CourseSection',
    required: true
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true
  },
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  },
  totalClasses: {
    type: Number,
    default: 0
  },
  classesAttended: {
    type: Number,
    default: 0
  },
  attendancePercentage: {
    type: Number,
    default: 0
  },
  attendanceStatus: {
    type: String,
    enum: ['At Risk', 'Good Standing'],
    default: 'Good Standing'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for uniqueness
AttendanceSummarySchema.index(
  { student: 1, course: 1, section: 1, semester: 1, academicYear: 1 },
  { unique: true }
);

module.exports = mongoose.model('AttendanceSummary', AttendanceSummarySchema);