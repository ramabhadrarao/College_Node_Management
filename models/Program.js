// models/Program.js
const mongoose = require('mongoose');

const ProgramSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  coordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  },
  duration: String,
  degreeType: String,
  description: String,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Create a compound index to ensure uniqueness of code + department
ProgramSchema.index({ code: 1, department: 1 }, { unique: true });

module.exports = mongoose.model('Program', ProgramSchema);