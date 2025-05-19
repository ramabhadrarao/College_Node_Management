// models/FeeStructure.js
const mongoose = require('mongoose');

const FeeStructureSchema = new mongoose.Schema({
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  program: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: true
  },
  feeType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeType',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  effectiveFrom: {
    type: Date,
    required: true
  },
  effectiveTo: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('FeeStructure', FeeStructureSchema);