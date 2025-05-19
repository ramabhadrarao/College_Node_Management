// models/CumulativeResult.js
const mongoose = require('mongoose');

const CumulativeResultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  upToSemester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester'
  },
  totalCredits: Number,
  creditsEarned: Number,
  cgpa: Number,
  resultStatus: {
    type: String,
    enum: ['In Progress', 'Completed', 'Graduated', 'Withheld'],
    default: 'In Progress'
  },
  remarks: String,
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CumulativeResult', CumulativeResultSchema);