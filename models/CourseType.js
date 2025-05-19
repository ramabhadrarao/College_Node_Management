// models/CourseType.js
const mongoose = require('mongoose');

const CourseTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String
}, {
  timestamps: true
});

module.exports = mongoose.model('CourseType', CourseTypeSchema);