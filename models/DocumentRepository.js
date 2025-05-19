// models/DocumentRepository.js
const mongoose = require('mongoose');

const DocumentRepositorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  documentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DocumentCategory'
  },
  attachment: {
    type: String,
    required: true
  },
  version: String,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accessLevel: {
    type: String,
    enum: ['public', 'restricted', 'private'],
    default: 'public'
  },
  allowedRoles: [String], // Array of role IDs if restricted
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DocumentRepository', DocumentRepositorySchema);