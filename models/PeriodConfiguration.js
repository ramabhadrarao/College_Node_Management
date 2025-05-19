// models/PeriodConfiguration.js
const mongoose = require('mongoose');

const PeriodConfigurationSchema = new mongoose.Schema({
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  },
  dayType: {
    type: String,
    enum: ['regular', 'half_day', 'special'],
    required: true
  },
  periodNumber: {
    type: Number,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for uniqueness
PeriodConfigurationSchema.index(
  { academicYear: 1, dayType: 1, periodNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model('PeriodConfiguration', PeriodConfigurationSchema);