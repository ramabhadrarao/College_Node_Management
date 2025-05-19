// models/Attendance.js
const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
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
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
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
  attendanceDate: {
    type: Date,
    required: true
  },
  period: Number,
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Excused'],
    default: 'Absent'
  },
  remarks: String,
  
  // Extended attendance properties
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseSection',
    required: true
  },
  academicCalendar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicCalendar'
  },
  timetable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Timetable'
  },
  attendanceMode: {
    type: String,
    enum: ['regular', 'makeup', 'special'],
    default: 'regular'
  },
  verificationStatus: {
    type: String,
    enum: ['unverified', 'verified', 'disputed'],
    default: 'unverified'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Attendance', AttendanceSchema);