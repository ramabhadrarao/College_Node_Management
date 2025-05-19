// models/ElectiveEligibility.js
const mongoose = require('mongoose');

const ElectiveEligibilitySchema = new mongoose.Schema({
  electiveGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElectiveGroup',
    required: true
  },
  program: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: true
  }
}, {
  timestamps: true
});

// Compound index for uniqueness
ElectiveEligibilitySchema.index(
  { electiveGroup: 1, program: 1 },
  { unique: true }
);

module.exports = mongoose.model('ElectiveEligibility', ElectiveEligibilitySchema);
