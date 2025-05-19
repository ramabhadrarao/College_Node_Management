// models/StudentMentoring.js
const mongoose = require('mongoose');

const StudentMentoringSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  },
  startDate: Date,
  endDate: Date,
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed'],
    default: 'active'
  },
  meetings: [{
    meetingDate: Date,
    meetingType: {
      type: String,
      default: 'regular'
    },
    topicsDiscussed: String,
    recommendations: String,
    followUpRequired: Boolean,
    followUpDate: Date,
    attachment: String
  }],
  goals: [{
    goalTitle: String,
    goalDescription: String,
    targetCompletionDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending'
    },
    completionDate: Date,
    remarks: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('StudentMentoring', StudentMentoringSchema);