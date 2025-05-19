// models/WorkingDayAdjustment.js
const mongoose = require('mongoose');

const WorkingDayAdjustmentSchema = new mongoose.Schema({
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  },
  adjustmentDate: {
    type: Date,
    required: true
  },
  adjustmentType: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  reason: String
}, {
  timestamps: true
});

module.exports = mongoose.model('WorkingDayAdjustment', WorkingDayAdjustmentSchema);