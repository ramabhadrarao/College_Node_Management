// models/WorkshopSeminar.js
const mongoose = require('mongoose');

const WorkshopSeminarSchema = new mongoose.Schema({
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  location: String,
  organizedBy: {
    type: String,
    required: true
  },
  startDate: Date,
  endDate: Date,
  description: String,
  attachment: String,
  visibility: {
    type: String,
    enum: ['show', 'hide'],
    default: 'show'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('WorkshopSeminar', WorkshopSeminarSchema);