// models/ElectiveGroup.js
const mongoose = require('mongoose');

const ElectiveGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true
  },
  electiveType: {
    type: String,
    required: true
  },
  minCredits: {
    type: Number,
    default: 0
  },
  maxCourses: {
    type: Number,
    default: 1
  },
  description: String,
  
  // Extended elective group properties
  minStudents: Number,
  maxStudents: Number,
  isCrossDepartment: {
    type: Boolean,
    default: false
  },
  registrationPriority: {
    type: String,
    enum: ['first_come', 'cgpa', 'lottery'],
    default: 'first_come'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ElectiveGroup', ElectiveGroupSchema);