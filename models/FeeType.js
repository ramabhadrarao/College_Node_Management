// models/FeeType.js
const mongoose = require('mongoose');

const FeeTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPeriod: {
    type: String,
    default: 'semester'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FeeType', FeeTypeSchema);