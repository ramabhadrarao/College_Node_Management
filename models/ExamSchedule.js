// models/ExamSchedule.js
const mongoose = require('mongoose');

const ExamScheduleSchema = new mongoose.Schema({
  examType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamType',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
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
  examDate: Date,
  examStartTime: String,
  examEndTime: String,
  examVenue: String,
  facultyAssigned: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  },
  maxMarks: Number
}, {
  timestamps: true
});

module.exports = mongoose.model('ExamSchedule', ExamScheduleSchema);