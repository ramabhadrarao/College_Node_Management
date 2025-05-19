// models/StudentScholarship.js
const mongoose = require('mongoose');

const StudentScholarshipSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  scholarshipType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScholarshipType',
    required: true
  },
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester'
  },
  amount: {
    type: Number,
    required: true
  },
  awardedDate: {
    type: Date,
    required: true
  },
  referenceNumber: String,
  attachment: String,
  remarks: String,
  status: {
    type: String,
    enum: ['active', 'inactive', 'revoked'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StudentScholarship', StudentScholarshipSchema);