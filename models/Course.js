// models/Course.js
const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester'
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  regulation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Regulation',
    required: true
  },
  courseType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseType',
    required: true
  },
  credits: {
    type: Number,
    required: true
  },
  syllabus: String,
  description: String,
  objectives: String,
  outcomes: String,
  prerequisites: String,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', CourseSchema);