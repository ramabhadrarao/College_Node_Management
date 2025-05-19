// models/Quiz.js
const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseModule',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  instructions: String,
  startDatetime: Date,
  endDatetime: Date,
  timeLimit: Number, // in minutes
  totalMarks: Number,
  passingPercentage: {
    type: Number,
    default: 35
  },
  shuffleQuestions: {
    type: Boolean,
    default: false
  },
  showResultsAfter: {
    type: String,
    enum: ['immediately', 'after_due_date', 'manually'],
    default: 'immediately'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Quiz', QuizSchema);