// models/GradeScale.js
const mongoose = require('mongoose');

const GradeScaleSchema = new mongoose.Schema({
  grade: {
    type: String,
    required: true
  },
  minMarks: {
    type: Number,
    required: true
  },
  maxMarks: {
    type: Number,
    required: true
  },
  gradePoint: {
    type: Number,
    required: true
  },
  description: String
}, {
  timestamps: true
});

module.exports = mongoose.model('GradeScale', GradeScaleSchema);