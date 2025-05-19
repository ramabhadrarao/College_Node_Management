// models/FacultyQualification.js
const mongoose = require('mongoose');

const FacultyQualificationSchema = new mongoose.Schema({
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  degree: {
    type: String,
    required: true
  },
  specialization: String,
  institution: {
    type: String,
    required: true
  },
  boardUniversity: String,
  passingYear: Number,
  percentageCgpa: String,
  certificateAttachment: String,
  visibility: {
    type: String,
    enum: ['show', 'hide'],
    default: 'show'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FacultyQualification', FacultyQualificationSchema);