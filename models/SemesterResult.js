// models/SemesterResult.js
const mongoose = require('mongoose');

const SemesterResultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester'
  },
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear'
  },
  totalCredits: Number,
  creditsEarned: Number,
  sgpa: Number,
  resultStatus: {
    type: String,
    enum: ['Incomplete', 'Completed', 'Withheld'],
    default: 'Incomplete'
  },
  remarks: String,
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SemesterResult', SemesterResultSchema);