// models/Timetable.js
const mongoose = require('mongoose');

const TimetableSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester'
  },
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear'
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  dayOfWeek: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  period: Number,
  startTime: String,
  endTime: String,
  sections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseSection'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Timetable', TimetableSchema);