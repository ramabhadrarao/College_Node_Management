// models/ElectiveGroupCourse.js
const mongoose = require('mongoose');

const ElectiveGroupCourseSchema = new mongoose.Schema({
  electiveGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElectiveGroup',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  }
}, {
  timestamps: true
});

// Compound index for uniqueness
ElectiveGroupCourseSchema.index(
  { electiveGroup: 1, course: 1 },
  { unique: true }
);

module.exports = mongoose.model('ElectiveGroupCourse', ElectiveGroupCourseSchema);