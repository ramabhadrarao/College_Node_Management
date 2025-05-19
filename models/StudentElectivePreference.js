// models/StudentElectivePreference.js
const mongoose = require('mongoose');

const StudentElectivePreferenceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  electiveGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElectiveGroup',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  preferenceOrder: {
    type: Number,
    required: true
  },
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StudentElectivePreference', StudentElectivePreferenceSchema);
