// models/DocumentTemplate.js
const mongoose = require('mongoose');

const DocumentTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  templateType: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  variables: String, // JSON string of variables
  attachment: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DocumentTemplate', DocumentTemplateSchema);