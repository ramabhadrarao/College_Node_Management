// models/Counselor.js
const mongoose = require('mongoose');

const CounselorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  specialization: String,
  qualification: String,
  contactNo: String,
  email: String,
  availableDays: String,
  availableHours: String,
  status: {
    type: String,
    enum: ['active', 'inactive', 'on_leave'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Counselor', CounselorSchema);