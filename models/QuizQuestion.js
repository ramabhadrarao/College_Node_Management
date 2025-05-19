// models/QuizQuestion.js
const mongoose = require('mongoose');

const QuizQuestionSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  questionText: {
    type: String,
    required: true
  },
  questionType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionType',
    required: true
  },
  imageAttachment: String,
  correctAnswer: String,
  explanation: String,
  marks: {
    type: Number,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  orderIndex: {
    type: Number,
    default: 0
  },
  options: [{
    optionText: String,
    isCorrect: Boolean,
    explanation: String,
    orderIndex: Number
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('QuizQuestion', QuizQuestionSchema);