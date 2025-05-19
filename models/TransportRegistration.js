// models/TransportRegistration.js
const mongoose = require('mongoose');

const TransportRegistrationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TransportationRoute',
    required: true
  },
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  },
  boardingStop: String,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TransportRegistration', TransportRegistrationSchema);
