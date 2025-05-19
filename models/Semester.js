// models/Semester.js
const mongoose = require('mongoose');

const SemesterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  },
  regulation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Regulation'
  },
  startDate: Date,
  endDate: Date,
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed'],
    default: 'upcoming'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Semester', SemesterSchema);