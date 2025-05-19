// models/WorkExperience.js
const mongoose = require('mongoose');

const WorkExperienceSchema = new mongoose.Schema({
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  institutionName: {
    type: String,
    required: true
  },
  experienceType: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    required: true
  },
  fromDate: Date,
  toDate: Date,
  numberOfYears: Number,
  responsibilities: String,
  serviceCertificateAttachment: String,
  visibility: {
    type: String,
    enum: ['show', 'hide'],
    default: 'show'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('WorkExperience', WorkExperienceSchema);