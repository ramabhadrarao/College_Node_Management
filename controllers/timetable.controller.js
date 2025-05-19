// controllers/timetable.controller.js
const Timetable = require('../models/Timetable');
const Course = require('../models/Course');
const Room = require('../models/Room');
const Faculty = require('../models/Faculty');
const CourseSection = require('../models/CourseSection');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Create timetable entry
exports.createTimetableEntry = catchAsync(async (req, res, next) => {
  const {
    course,
    faculty,
    semester,
    academicYear,
    room,
    dayOfWeek,
    period,
    startTime,
    endTime,
    sections
  } = req.body;
  
  // Validate required fields
  if (!course || !faculty || !semester || !academicYear || !dayOfWeek || !period) {
    return next(new AppError('Missing required fields', 400));
  }
  
  // Check for conflicts - same room, day, and period
  if (room) {
    const existingRoomSchedule = await Timetable.findOne({
      room,
      dayOfWeek,
      period,
      semester,
      academicYear
    });
    
    if (existingRoomSchedule) {
      return next(new AppError('Room is already scheduled for this time slot', 400));
    }
  }
  
  // Check for conflicts - same faculty, day, and period
  const existingFacultySchedule = await Timetable.findOne({
    faculty,
    dayOfWeek,
    period,
    semester,
    academicYear
  });
  
  if (existingFacultySchedule) {
    return next(new AppError('Faculty is already scheduled for this time slot', 400));
  }
  
  // Create timetable entry
  const timetableEntry = await Timetable.create({
    course,
    faculty,
    semester,
    academicYear,
    room,
    dayOfWeek,
    period,
    startTime,
    endTime,
    sections
  });
  
  // Populate references for response
  await timetableEntry
    .populate('course', 'name courseCode')
    .populate('faculty', 'firstName lastName')
    .populate('semester', 'name')
    .populate('academicYear', 'yearName')
    .populate('room', 'roomNumber building')
    .populate('sections', 'sectionName');
  
  res.status(201).json({
    status: 'success',
    data: {
      timetable: timetableEntry
    }
  });
});

// Get timetable entries
exports.getTimetableEntries = catchAsync(async (req, res, next) => {
  const { semester, academicYear, course, faculty, room, dayOfWeek, section } = req.query;
  
  // Build query
  const query = {};
  
  if (semester) query.semester = semester;
  if (academicYear) query.academicYear = academicYear;
  if (course) query.course = course;
  if (faculty) query.faculty = faculty;
  if (room) query.room = room;
  if (dayOfWeek) query.dayOfWeek = dayOfWeek;
  if (section) query.sections = { $in: [section] };
  
  // Execute query
  const timetableEntries = await Timetable.find(query)
    .populate('course', 'name courseCode')
    .populate('faculty', 'firstName lastName')
    .populate('semester', 'name')
    .populate('academicYear', 'yearName')
    .populate('room', 'roomNumber building')
    .populate('sections', 'sectionName')
    .sort({ dayOfWeek: 1, period: 1 });
  
  res.status(200).json({
    status: 'success',
    results: timetableEntries.length,
    data: {
      timetable: timetableEntries
    }
  });
});

// Get faculty timetable
exports.getFacultyTimetable = catchAsync(async (req, res, next) => {
  const { facultyId } = req.params;
  const { semester, academicYear } = req.query;
  
  // Validate required parameters
  if (!semester || !academicYear) {
    return next(new AppError('Semester and academic year are required', 400));
  }
  
  // Get timetable entries
  const timetableEntries = await Timetable.find({
    faculty: facultyId,
    semester,
    academicYear
  })
    .populate('course', 'name courseCode')
    .populate('semester', 'name')
    .populate('academicYear', 'yearName')
    .populate('room', 'roomNumber building')
    .populate('sections', 'sectionName')
    .sort({ dayOfWeek: 1, period: 1 });
  
  // Format timetable by day and period
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const timetableByDay = {};
  
  daysOfWeek.forEach(day => {
    timetableByDay[day] = [];
  });
  
  timetableEntries.forEach(entry => {
    if (timetableByDay[entry.dayOfWeek]) {
      timetableByDay[entry.dayOfWeek].push(entry);
    }
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      timetable: timetableByDay
    }
  });
});

// Get room timetable
exports.getRoomTimetable = catchAsync(async (req, res, next) => {
  const { roomId } = req.params;
  const { semester, academicYear } = req.query;
  
  // Validate required parameters
  if (!semester || !academicYear) {
    return next(new AppError('Semester and academic year are required', 400));
  }
  
  // Get timetable entries
  const timetableEntries = await Timetable.find({
    room: roomId,
    semester,
    academicYear
  })
    .populate('course', 'name courseCode')
    .populate('faculty', 'firstName lastName')
    .populate('semester', 'name')
    .populate('academicYear', 'yearName')
    .populate('sections', 'sectionName')
    .sort({ dayOfWeek: 1, period: 1 });
  
  // Format timetable by day and period
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const timetableByDay = {};
  
  daysOfWeek.forEach(day => {
    timetableByDay[day] = [];
  });
  
  timetableEntries.forEach(entry => {
    if (timetableByDay[entry.dayOfWeek]) {
      timetableByDay[entry.dayOfWeek].push(entry);
    }
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      timetable: timetableByDay
    }
  });
});

// Get section timetable
exports.getSectionTimetable = catchAsync(async (req, res, next) => {
  const { sectionId } = req.params;
  const { semester, academicYear } = req.query;
  
  // Validate required parameters
  if (!semester || !academicYear) {
    return next(new AppError('Semester and academic year are required', 400));
  }
  
  // Get timetable entries
  const timetableEntries = await Timetable.find({
    sections: { $in: [sectionId] },
    semester,
    academicYear
  })
    .populate('course', 'name courseCode')
    .populate('faculty', 'firstName lastName')
    .populate('semester', 'name')
    .populate('academicYear', 'yearName')
    .populate('room', 'roomNumber building')
    .sort({ dayOfWeek: 1, period: 1 });
  
  // Format timetable by day and period
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const timetableByDay = {};
  
  daysOfWeek.forEach(day => {
    timetableByDay[day] = [];
  });
  
  timetableEntries.forEach(entry => {
    if (timetableByDay[entry.dayOfWeek]) {
      timetableByDay[entry.dayOfWeek].push(entry);
    }
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      timetable: timetableByDay
    }
  });
});

// Update timetable entry
exports.updateTimetableEntry = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const {
    room,
    dayOfWeek,
    period,
    startTime,
    endTime
  } = req.body;
  
  // Find the timetable entry
  const timetableEntry = await Timetable.findById(id);
  
  if (!timetableEntry) {
    return next(new AppError('Timetable entry not found', 404));
  }
  
  // Check for conflicts if updating room, day, or period
  if ((room && room !== timetableEntry.room.toString()) || 
      (dayOfWeek && dayOfWeek !== timetableEntry.dayOfWeek) || 
      (period && period !== timetableEntry.period)) {
    
    const conflictQuery = {
      _id: { $ne: id },
      semester: timetableEntry.semester,
      academicYear: timetableEntry.academicYear
    };
    
    // Add new values to conflict check
    if (room) conflictQuery.room = room;
    if (dayOfWeek) conflictQuery.dayOfWeek = dayOfWeek;
    if (period) conflictQuery.period = period;
    
    const existingSchedule = await Timetable.findOne(conflictQuery);
    
    if (existingSchedule) {
      return next(new AppError('Room is already scheduled for this time slot', 400));
    }
  }
  
  // Update fields
  if (room) timetableEntry.room = room;
  if (dayOfWeek) timetableEntry.dayOfWeek = dayOfWeek;
  if (period) timetableEntry.period = period;
  if (startTime) timetableEntry.startTime = startTime;
  if (endTime) timetableEntry.endTime = endTime;
  
  // Save changes
  await timetableEntry.save();
  
  // Populate references for response
  await timetableEntry
    .populate('course', 'name courseCode')
    .populate('faculty', 'firstName lastName')
    .populate('semester', 'name')
    .populate('academicYear', 'yearName')
    .populate('room', 'roomNumber building')
    .populate('sections', 'sectionName');
  
  res.status(200).json({
    status: 'success',
    data: {
      timetable: timetableEntry
    }
  });
});

// Delete timetable entry
exports.deleteTimetableEntry = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const timetableEntry = await Timetable.findByIdAndDelete(id);
  
  if (!timetableEntry) {
    return next(new AppError('Timetable entry not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Timetable entry deleted successfully',
    data: null
  });
});

// Bulk import timetable
exports.bulkImportTimetable = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a file', 400));
  }
  
  const fileData = await fileService.processFile(req.file.buffer, req.file.mimetype);
  
  if (!fileData || !Array.isArray(fileData) || fileData.length === 0) {
    return next(new AppError('Invalid file or empty data', 400));
  }
  
  // Process each row
  const results = {
    success: [],
    failures: []
  };
  
  for (const row of fileData) {
    try {
      // Validate required fields
      if (!row.courseId || !row.facultyId || !row.semesterId || !row.academicYearId || 
          !row.dayOfWeek || !row.period) {
        results.failures.push({
          row,
          error: 'Missing required fields'
        });
        continue;
      }
      
      // Check for conflicts
      const conflictQuery = {
        semester: row.semesterId,
        academicYear: row.academicYearId,
        dayOfWeek: row.dayOfWeek,
        period: row.period
      };
      
      if (row.roomId) {
        conflictQuery.room = row.roomId;
        const roomConflict = await Timetable.findOne(conflictQuery);
        
        if (roomConflict) {
          results.failures.push({
            row,
            error: 'Room conflict detected'
          });
          continue;
        }
      }
      
      // Check faculty conflict
      const facultyConflict = await Timetable.findOne({
        ...conflictQuery,
        faculty: row.facultyId
      });
      
      if (facultyConflict) {
        results.failures.push({
          row,
          error: 'Faculty conflict detected'
        });
        continue;
      }
      
      // Create timetable entry
      const timetableEntry = await Timetable.create({
        course: row.courseId,
        faculty: row.facultyId,
        semester: row.semesterId,
        academicYear: row.academicYearId,
        room: row.roomId || null,
        dayOfWeek: row.dayOfWeek,
        period: row.period,
        startTime: row.startTime,
        endTime: row.endTime,
        sections: row.sectionIds ? row.sectionIds.split(',') : []
      });
      
      results.success.push({
        id: timetableEntry._id,
        course: row.courseId,
        faculty: row.facultyId,
        dayOfWeek: row.dayOfWeek,
        period: row.period
      });
    } catch (error) {
      results.failures.push({
        row,
        error: error.message
      });
    }
  }
  
  res.status(200).json({
    status: 'success',
    message: `Processed ${fileData.length} entries. Success: ${results.success.length}, Failures: ${results.failures.length}`,
    data: results
  });
});