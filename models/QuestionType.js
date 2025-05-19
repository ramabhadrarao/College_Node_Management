// models/QuestionType.js
const mongoose = require('mongoose');

const QuestionTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String
}, {
  timestamps: true
});

module.exports = mongoose.model('QuestionType', QuestionTypeSchema);