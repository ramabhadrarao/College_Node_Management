// models/CounselingService.js
const mongoose = require('mongoose');

const CounselingServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  serviceType: {
    type: String,
    required: true
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CounselingService', CounselingServiceSchema);