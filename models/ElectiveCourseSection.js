// models/ElectiveCourseSection.js
const mongoose = require('mongoose');

const ElectiveCourseSectionSchema = new mongoose.Schema({
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
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseSection',
    required: true
  },
  quota: Number,
  filled: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index for uniqueness
ElectiveCourseSectionSchema.index(
  { electiveGroup: 1, course: 1, section: 1 },
  { unique: true }
);

module.exports = mongoose.model('ElectiveCourseSection', ElectiveCourseSectionSchema);
