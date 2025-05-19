// models/StudentCourseResult.js
const mongoose = require('mongoose');

const StudentCourseResultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester'
  },
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear'
  },
  totalMarks: Number,
  grade: String,
  gradePoint: Number,
  creditsEarned: Number,
  resultStatus: {
    type: String,
    enum: ['Incomplete', 'Passed', 'Failed', 'Withheld', 'Absent'],
    default: 'Incomplete'
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  },
  recordedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  },
  verifiedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('StudentCourseResult', StudentCourseResultSchema);