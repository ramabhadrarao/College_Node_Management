// models/BatchSectionDefault.js
const mongoose = require('mongoose');

const BatchSectionDefaultSchema = new mongoose.Schema({
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
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
  }
}, {
  timestamps: true
});

// Compound index for uniqueness
BatchSectionDefaultSchema.index(
  { batch: 1, course: 1, section: 1 },
  { unique: true }
);

module.exports = mongoose.model('BatchSectionDefault', BatchSectionDefaultSchema);