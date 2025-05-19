
// models/StudentFeePayment.js
const mongoose = require('mongoose');

const StudentFeePaymentSchema = new mongoose.Schema({
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentFeeInvoice',
    required: true
  },
  paymentMethod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentMethod',
    required: true
  },
  transactionId: String,
  paymentDate: {
    type: Date,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentProofAttachment: String,
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  remarks: String
}, {
  timestamps: true
});

module.exports = mongoose.model('StudentFeePayment', StudentFeePaymentSchema);