// models/Student.js
const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  admissionNo: {
    type: String,
    required: true,
    unique: true
  },
  regdNo: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  dob: Date,
  email: {
    type: String,
    required: true
  },
  mobile: String,
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  program: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  regulation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Regulation',
    required: true
  },
  currentSemester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester'
  },
  fatherName: String,
  motherName: String,
  fatherMobile: String,
  motherMobile: String,
  address: String,
  permanentAddress: String,
  nationality: String,
  religion: String,
  studentType: {
    type: String,
    enum: ['Day Scholar', 'Hosteler', 'Day Scholar College Bus'],
    required: true
  },
  caste: String,
  subCaste: String,
  bloodGroup: String,
  photoAttachment: String,
  aadharAttachment: String,
  fatherAadharAttachment: String,
  motherAadharAttachment: String,
  status: {
    type: String,
    enum: ['active', 'inactive', 'graduated', 'suspended', 'withdrawn'],
    default: 'active'
  },
  educationalDetails: [{
    courseName: String,
    yearOfPassing: Number,
    classDivision: String,
    percentageGrade: String,
    boardUniversity: String,
    district: String,
    state: String,
    subjectsOffered: String,
    certificateAttachment: String
  }],
  additionalDocuments: [{
    documentName: String,
    attachment: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', StudentSchema);