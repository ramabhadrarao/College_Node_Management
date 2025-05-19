// models/Faculty.js
const mongoose = require('mongoose');

const FacultySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  regdno: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: String,
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  dob: Date,
  contactNo: String,
  email: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  designation: String,
  qualification: String,
  specialization: String,
  joinDate: {
    type: Date,
    required: true
  },
  address: String,
  bloodGroup: String,
  isActive: {
    type: Boolean,
    default: true
  },
  aadharAttachment: String,
  panAttachment: String,
  photoAttachment: String,
  visibility: {
    type: String,
    enum: ['show', 'hide'],
    default: 'show'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'on_leave'],
    default: 'active'
  },
  additionalDetails: {
    fatherName: String,
    fatherOccupation: String,
    motherName: String,
    motherOccupation: String,
    maritalStatus: String,
    spouseName: String,
    spouseOccupation: String,
    nationality: String,
    religion: String,
    caste: String,
    subCaste: String,
    aadharNo: String,
    panNo: String,
    contactNo2: String,
    permanentAddress: String,
    correspondenceAddress: String,
    scopusAuthorId: String,
    orcidId: String,
    googleScholarIdLink: String,
    aicteId: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Faculty', FacultySchema);