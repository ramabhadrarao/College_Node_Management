// models/LibraryBook.js
const mongoose = require('mongoose');

const LibraryBookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  publisher: String,
  isbn: String,
  edition: String,
  publicationYear: Number,
  subject: String,
  description: String,
  pages: Number,
  copiesAvailable: {
    type: Number,
    default: 0
  },
  totalCopies: {
    type: Number,
    default: 0
  },
  locationShelf: String,
  coverImageAttachment: String,
  status: {
    type: String,
    enum: ['available', 'unavailable', 'archived'],
    default: 'available'
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LibraryBookCategory'
  }],
  authors: [{
    authorName: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('LibraryBook', LibraryBookSchema);