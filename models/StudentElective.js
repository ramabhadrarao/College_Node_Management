// models/StudentElective.js
const mongoose = require('mongoose');

const StudentElectiveSchema = new mongoose.Schema({
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
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true
  },
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  },
  selectedAt: {
    type: Date,
    default: Date.now
  },
  approved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  },
  approvedAt: Date,
  
  // Extended student elective properties
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseSection',
    required: true
  },
  preferenceOrder: {
    type: Number,
    default: 1
  },
  allocationStatus: {
    type: String,
    enum: ['pending', 'allocated', 'waitlisted', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StudentElective', StudentElectiveSchema);