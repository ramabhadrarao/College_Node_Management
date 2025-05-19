// models/CourseSection.js
const mongoose = require('mongoose');

const CourseSectionSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  sectionName: {
    type: String,
    required: true
  },
  sectionType: {
    type: String,
    enum: ['theory', 'lab', 'tutorial'],
    required: true
  },
  capacity: Number,
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique section names per course
CourseSectionSchema.index(
  { course: 1, sectionName: 1 },
  { unique: true }
);

module.exports = mongoose.model('CourseSection', CourseSectionSchema);