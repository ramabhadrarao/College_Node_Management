// models/ResearchPublication.js
const mongoose = require('mongoose');

const ResearchPublicationSchema = new mongoose.Schema({
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  journalName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  publicationDate: Date,
  doi: String,
  description: String,
  attachment: String,
  visibility: {
    type: String,
    enum: ['show', 'hide'],
    default: 'show'
  },
  citations: Number,
  impactFactor: Number
}, {
  timestamps: true
});

module.exports = mongoose.model('ResearchPublication', ResearchPublicationSchema);