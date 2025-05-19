// models/StudentFeeInvoice.js
const mongoose = require('mongoose');

const StudentFeeInvoiceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true
  },
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true
  },
  invoiceDate: {
    type: Date,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'partially_paid', 'overdue', 'cancelled'],
    default: 'pending'
  },
  remarks: String,
  items: [{
    feeType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeType'
    },
    amount: Number,
    waiverAmount: {
      type: Number,
      default: 0
    },
    netAmount: Number
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('StudentFeeInvoice', StudentFeeInvoiceSchema);