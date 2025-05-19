// models/ExamType.js
const mongoose = require('mongoose');

const ExamTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String
}, {
  timestamps: true
});

module.exports = mongoose.model('ExamType', ExamTypeSchema);