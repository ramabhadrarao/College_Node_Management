// models/LibraryBookCategory.js
const mongoose = require('mongoose');

const LibraryBookCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LibraryBookCategory'
  },
  description: String
}, {
  timestamps: true
});

module.exports = mongoose.model('LibraryBookCategory', LibraryBookCategorySchema);