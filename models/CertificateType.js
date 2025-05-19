// models/CertificateType.js
const mongoose = require('mongoose');

const CertificateTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DocumentTemplate'
  },
  prefix: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CertificateType', CertificateTypeSchema);