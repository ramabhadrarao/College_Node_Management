// models/DocumentCategory.js
const mongoose = require('mongoose');

const DocumentCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DocumentCategory'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DocumentCategory', DocumentCategorySchema);