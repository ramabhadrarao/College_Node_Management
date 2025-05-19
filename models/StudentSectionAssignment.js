// models/StudentSectionAssignment.js
const mongoose = require('mongoose');

const StudentSectionAssignmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseSection',
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
  assignmentDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for uniqueness
StudentSectionAssignmentSchema.index(
  { student: 1, course: 1, section: 1, semester: 1, academicYear: 1 },
  { unique: true }
);

module.exports = mongoose.model('StudentSectionAssignment', StudentSectionAssignmentSchema);
