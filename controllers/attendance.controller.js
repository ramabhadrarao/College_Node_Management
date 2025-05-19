// controllers/attendance.controller.js
const Attendance = require('../models/Attendance');
const AttendanceBatchUpdate = require('../models/AttendanceBatchUpdate');
const AttendanceSummary = require('../models/AttendanceSummary');
const Student = require('../models/Student');
const StudentSectionAssignment = require('../models/StudentSectionAssignment');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Mark attendance for a student
exports.markAttendance = catchAsync(async (req, res, next) => {
  const { student, course, section, academicYear, semester, attendanceDate, period, status } = req.body;
  
  // Check if attendance already exists
  const existingAttendance = await Attendance.findOne({
    student,
    course,
    section,
    attendanceDate,
    period: period || 1
  });
  
  let attendance;
  
  if (existingAttendance) {
    // Update existing attendance
    existingAttendance.status = status;
    existingAttendance.faculty = req.user.faculty;
    attendance = await existingAttendance.save();
  } else {
    // Create new attendance record
    attendance = await Attendance.create({
      student,
      course,
      section,
      semester,
      academicYear,
      attendanceDate,
      period: period || 1,
      status,
      faculty: req.user.faculty,
      attendanceMode: 'regular',
      verificationStatus: 'unverified'
    });
  }
  
  res.status(201).json({
    status: 'success',
    data: {
      attendance
    }
  });
});

// Batch update attendance
exports.batchUpdateAttendance = catchAsync(async (req, res, next) => {
  const { course, section, attendanceDate, period, studentAttendance } = req.body;
  
  // Validate input
  if (!studentAttendance || !Array.isArray(studentAttendance)) {
    return next(new AppError('Student attendance data is required', 400));
  }
  
  // Start a transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Create batch update record
    const batchUpdate = await AttendanceBatchUpdate.create([{
      faculty: req.user.faculty,
      course,
      section,
      attendanceDate: new Date(attendanceDate),
      period: period || 1,
      totalRecords: studentAttendance.length,
      presentCount: studentAttendance.filter(sa => sa.status === 'Present').length,
      absentCount: studentAttendance.filter(sa => sa.status === 'Absent').length,
      ipAddress: req.ip
    }], { session });
    
    // Get academic year and semester (should be provided or fetched)
    // This is simplified - you'd need to fetch the current academic year and semester
    const academicYear = req.body.academicYear;
    const semester = req.body.semester;
    
    // Update/create attendance records for each student
    const operations = studentAttendance.map(sa => ({
      updateOne: {
        filter: {
          student: sa.student,
          course,
          section,
          attendanceDate: new Date(attendanceDate),
          period: period || 1
        },
        update: {
          $set: {
            status: sa.status,
            faculty: req.user.faculty,
            semester,
            academicYear,
            attendanceMode: 'regular',
            verificationStatus: 'unverified'
          }
        },
        upsert: true
      }
    }));
    
    await Attendance.bulkWrite(operations, { session });
    
    // Commit transaction
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({
      status: 'success',
      message: `Attendance updated for ${studentAttendance.length} students`,
      data: {
        batchUpdate: batchUpdate[0]
      }
    });
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

// Get attendance for a student
exports.getStudentAttendance = catchAsync(async (req, res, next) => {
  const { studentId } = req.params;
  const { course, fromDate, toDate } = req.query;
  
  // Build query
  const query = { student: studentId };
  if (course) query.course = course;
  
  // Date range filter
  if (fromDate || toDate) {
    query.attendanceDate = {};
    if (fromDate) query.attendanceDate.$gte = new Date(fromDate);
    if (toDate) query.attendanceDate.$lte = new Date(toDate);
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 30;
  const skip = (page - 1) * limit;
  
  // Execute query
  const [attendanceRecords, total] = await Promise.all([
    Attendance.find(query)
      .populate('course', 'name courseCode')
      .populate('section', 'sectionName')
      .populate('faculty', 'firstName lastName')
      .sort({ attendanceDate: -1 })
      .skip(skip)
      .limit(limit),
    Attendance.countDocuments(query)
  ]);
  
  res.status(200).json({
    status: 'success',
    results: attendanceRecords.length,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    },
    data: {
      attendance: attendanceRecords
    }
  });
});

// Get attendance for a course/section
exports.getCourseAttendance = catchAsync(async (req, res, next) => {
  const { course, section, date, period } = req.query;
  
  if (!course || !section || !date) {
    return next(new AppError('Course, section, and date are required', 400));
  }
  
  // Build query
  const query = {
    course,
    section,
    attendanceDate: new Date(date)
  };
  
  if (period) query.period = period;
  
  // Get attendance records
  const attendanceRecords = await Attendance.find(query)
    .populate({
      path: 'student',
      select: 'name admissionNo'
    });
  
  // Get all students assigned to this section
  const assignedStudents = await StudentSectionAssignment.find({
    course,
    section,
    isActive: true
  }).populate('student', 'name admissionNo');
  
  // Create a map of attendance status
  const attendanceMap = {};
  attendanceRecords.forEach(record => {
    attendanceMap[record.student._id.toString()] = record.status;
  });
  
  // Create consolidated response with all students
  const attendanceData = assignedStudents.map(assignment => {
    const studentId = assignment.student._id.toString();
    return {
      student: assignment.student,
      status: attendanceMap[studentId] || 'Not Marked',
      isMarked: attendanceMap[studentId] ? true : false
    };
  });
  
  res.status(200).json({
    status: 'success',
    results: attendanceData.length,
    data: {
      date,
      period: period || 'All',
      attendanceRecords: attendanceData
    }
  });
});

// Get attendance summary
exports.getAttendanceSummary = catchAsync(async (req, res, next) => {
  const { studentId, course, semester, academicYear } = req.query;
  
  // Build query
  const query = {};
  if (studentId) query.student = studentId;
  if (course) query.course = course;
  if (semester) query.semester = semester;
  if (academicYear) query.academicYear = academicYear;
  
  // Execute query
  const summaries = await AttendanceSummary.find(query)
    .populate('student', 'name admissionNo')
    .populate('course', 'name courseCode')
    .populate('section', 'sectionName')
    .populate('semester', 'name')
    .populate('academicYear', 'yearName');
  
  res.status(200).json({
    status: 'success',
    results: summaries.length,
    data: {
      summaries
    }
  });
});

// Update attendance summaries
exports.updateAttendanceSummaries = catchAsync(async (req, res, next) => {
  const { course, section, semester, academicYear } = req.body;
  
  if (!course || !section || !semester || !academicYear) {
    return next(new AppError('Course, section, semester, and academic year are required', 400));
  }
  
  // Get students assigned to this section
  const studentAssignments = await StudentSectionAssignment.find({
    course,
    section,
    semester,
    academicYear,
    isActive: true
  });
  
  let updatedCount = 0;
  
  // Process each student
  for (const assignment of studentAssignments) {
    // Get attendance records
    const attendanceRecords = await Attendance.find({
      student: assignment.student,
      course,
      section,
      semester,
      academicYear
    });
    
    if (attendanceRecords.length === 0) continue;
    
    // Calculate statistics
    const totalClasses = attendanceRecords.length;
    const classesAttended = attendanceRecords.filter(a => a.status === 'Present').length;
    const attendancePercentage = (classesAttended / totalClasses) * 100;
    
    // Get minimum required attendance from settings (simplified)
    const minAttendancePercentage = 75;
    
    // Check if at risk
    const attendanceStatus = attendancePercentage < minAttendancePercentage ? 'At Risk' : 'Good Standing';
    
    // Update summary
    await AttendanceSummary.findOneAndUpdate(
      {
        student: assignment.student,
        course,
        section,
        semester,
        academicYear
      },
      {
        totalClasses,
        classesAttended,
        attendancePercentage,
        attendanceStatus,
        lastUpdated: new Date()
      },
      { upsert: true }
    );
    
    updatedCount++;
  }
  
  res.status(200).json({
    status: 'success',
    message: `Updated ${updatedCount} attendance summaries`,
    data: {
      updatedCount
    }
  });
});

// Export attendance report
exports.exportAttendanceReport = catchAsync(async (req, res, next) => {
  const { course, section, fromDate, toDate, format } = req.query;
  
  if (!course || !section) {
    return next(new AppError('Course and section are required', 400));
  }
  
  // Build query
  const query = { course, section };
  
  // Date range filter
  if (fromDate || toDate) {
    query.attendanceDate = {};
    if (fromDate) query.attendanceDate.$gte = new Date(fromDate);
    if (toDate) query.attendanceDate.$lte = new Date(toDate);
  }
  
  // Get attendance records
  const attendanceRecords = await Attendance.find(query)
    .populate('student', 'name admissionNo')
    .sort({ attendanceDate: 1 });
  
  // Format data for export
  const exportData = [];
  
  // Group by date
  const dateGroups = {};
  attendanceRecords.forEach(record => {
    const dateKey = record.attendanceDate.toISOString().split('T')[0];
    if (!dateGroups[dateKey]) {
      dateGroups[dateKey] = [];
    }
    dateGroups[dateKey].push(record);
  });
  
  // Create report data
  const reportData = Object.entries(dateGroups).map(([date, records]) => {
    const presentCount = records.filter(r => r.status === 'Present').length;
    const absentCount = records.filter(r => r.status === 'Absent').length;
    const totalCount = records.length;
    
    return {
      date,
      totalStudents: totalCount,
      presentCount,
      absentCount,
      attendancePercentage: (presentCount / totalCount) * 100
    };
  });
  
  // Generate report based on format
  if (format === 'csv') {
    // Generate CSV
    // Implementation depends on CSV generation library
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.csv');
    // Return CSV data
  } else {
    // Default JSON format
    res.status(200).json({
      status: 'success',
      data: {
        report: reportData
      }
    });
  }
});