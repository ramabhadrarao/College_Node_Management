// models/AcademicTerm.js
const mongoose = require('mongoose');

const AcademicTermSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AcademicTerm', AcademicTermSchema);