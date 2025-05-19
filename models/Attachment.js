// models/Attachment.js
const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema({
  uploaderUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  fileName: {
    type: String,
    required: true
  },
  originalFileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  fileSizeBytes: {
    type: Number,
    required: true
  },
  storageLocation: {
    type: String,
    default: 'local'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Attachment', AttachmentSchema);