// models/StudentEducationalDetail.js
const mongoose = require('mongoose');

const StudentEducationalDetailSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  eduCourseName: {
    type: String,
    required: true
  },
  yearOfPassing: {
    type: Number,
    required: true
  },
  classDivision: String,
  percentageGrade: String,
  boardUniversity: String,
  district: String,
  state: String,
  subjectsOffered: String,
  certificateAttachment: String
}, {
  timestamps: true
});

module.exports = mongoose.model('StudentEducationalDetail', StudentEducationalDetailSchema);