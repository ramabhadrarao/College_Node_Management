// models/AcademicCalendar.js
const mongoose = require('mongoose');

const AcademicCalendarSchema = new mongoose.Schema({
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true
  },
  calendarDate: {
    type: Date,
    required: true
  },
  dayType: {
    type: String,
    enum: ['teaching_day', 'holiday', 'exam_day', 'event', 'weekend'],
    required: true
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique dates per academic year
AcademicCalendarSchema.index(
  { academicYear: 1, calendarDate: 1 },
  { unique: true }
);

module.exports = mongoose.model('AcademicCalendar', AcademicCalendarSchema);