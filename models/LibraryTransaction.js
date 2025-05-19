// models/LibraryTransaction.js
const mongoose = require('mongoose');

const LibraryTransactionSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LibraryBook',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issueDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  returnDate: Date,
  renewedCount: {
    type: Number,
    default: 0
  },
  fineAmount: {
    type: Number,
    default: 0
  },
  finePaid: {
    type: Boolean,
    default: false
  },
  paymentId: Number,
  remarks: String,
  status: {
    type: String,
    enum: ['issued', 'returned', 'overdue', 'lost', 'damaged'],
    default: 'issued'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LibraryTransaction', LibraryTransactionSchema);