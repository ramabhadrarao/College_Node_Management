// models/ScholarshipType.js
const mongoose = require('mongoose');

const ScholarshipTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  source: String,
  renewable: {
    type: Boolean,
    default: false
  },
  renewalCriteria: String,
  maxAmount: Number
}, {
  timestamps: true
});

module.exports = mongoose.model('ScholarshipType', ScholarshipTypeSchema);