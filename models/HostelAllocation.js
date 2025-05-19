// models/HostelAllocation.js
const mongoose = require('mongoose');

const HostelAllocationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HostelRoom',
    required: true
  },
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  },
  fromDate: {
    type: Date,
    required: true
  },
  toDate: Date,
  status: {
    type: String,
    enum: ['current', 'past', 'cancelled'],
    default: 'current'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('HostelAllocation', HostelAllocationSchema);