// models/HostelComplaint.js
const mongoose = require('mongoose');

const HostelComplaintSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  building: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HostelBuilding',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HostelRoom'
  },
  complaintType: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  attachment: String,
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'resolved', 'rejected'],
    default: 'pending'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolution: String,
  resolvedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('HostelComplaint', HostelComplaintSchema);