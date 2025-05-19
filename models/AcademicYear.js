// models/AcademicYear.js
const mongoose = require('mongoose');

const AcademicYearSchema = new mongoose.Schema({
  yearName: {
    type: String,
    required: true,
    unique: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed'],
    default: 'upcoming'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AcademicYear', AcademicYearSchema);