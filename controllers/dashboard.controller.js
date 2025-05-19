// controllers/dashboard.controller.js
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const Department = require('../models/Department');
const StudentCourseResult = require('../models/StudentCourseResult');
const StudentFeeInvoice = require('../models/StudentFeeInvoice');
const StudentFeePayment = require('../models/StudentFeePayment');
const LibraryTransaction = require('../models/LibraryTransaction');
const FacultySectionAssignment = require('../models/FacultySectionAssignment');
const AttendanceBatchUpdate = require('../models/AttendanceBatchUpdate');
const AttendanceSummary = require('../models/AttendanceSummary');
const Timetable = require('../models/Timetable');
const StudentSectionAssignment = require('../models/StudentSectionAssignment');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * Get admin dashboard data
 * @route GET /api/dashboard/admin
 * @access Admin
 */
exports.getAdminDashboard = catchAsync(async (req, res, next) => {
  // Students count
  const totalStudents = await Student.countDocuments();
  
  // Students by status
  const studentsByStatus = await Student.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        status: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);
  
  // Faculty count
  const totalFaculty = await Faculty.countDocuments();
  
  // Faculty by status
  const facultyByStatus = await Faculty.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        status: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);
  
  // Department counts with faculty count in each
  const departmentStats = await Department.aggregate([
    {
      $lookup: {
        from: 'faculties',
        localField: '_id',
        foreignField: 'department',
        as: 'facultyMembers'
      }
    },
    {
      $project: {
        _id: 1,
        name: 1,
        code: 1,
        facultyCount: { $size: '$facultyMembers' }
      }
    }
  ]);
  
  // Course counts
  const totalCourses = await Course.countDocuments();
  const activeCourses = await Course.countDocuments({ status: 'active' });
  
  // Recent fee collections - last 5 payments
  let recentFeePayments = [];
  try {
    recentFeePayments = await StudentFeePayment.find()
      .sort({ paymentDate: -1 })
      .limit(5)
      .populate('invoice')
      .lean();
  } catch (error) {
    console.log('Error fetching fee payments:', error.message);
  }
  
  // Fee collection by month (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  
  let monthlyFeeCollection = [];
  try {
    monthlyFeeCollection = await StudentFeePayment.aggregate([
      {
        $match: {
          paymentDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' }
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          total: 1
        }
      }
    ]);
  } catch (error) {
    console.log('Error fetching monthly fee collection:', error.message);
  }
  
  // Format monthly data
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedMonthlyData = monthlyFeeCollection.map(item => ({
    month: `${monthNames[item.month - 1]} ${item.year}`,
    total: item.total
  }));
  
  // Student registration statistics by month
  let studentRegistrationStats = [];
  try {
    studentRegistrationStats = await Student.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          count: 1
        }
      }
    ]);
  } catch (error) {
    console.log('Error fetching student registration stats:', error.message);
  }
  
  // Format registration data
  const formattedRegistrationData = studentRegistrationStats.map(item => ({
    month: `${monthNames[item.month - 1]} ${item.year}`,
    count: item.count
  }));
  
  res.status(200).json({
    status: 'success',
    data: {
      totalStudents,
      studentsByStatus,
      totalFaculty,
      facultyByStatus,
      departmentStats,
      totalCourses,
      activeCourses,
      recentFeePayments,
      monthlyFeeCollection: formattedMonthlyData,
      studentRegistrationStats: formattedRegistrationData
    }
  });
});

/**
 * Get faculty dashboard data
 * @route GET /api/dashboard/faculty/:facultyId
 * @access Faculty
 */
exports.getFacultyDashboard = catchAsync(async (req, res, next) => {
  const { facultyId } = req.params;
  
  // Get faculty details
  const faculty = await Faculty.findById(facultyId)
    .populate('department', 'name code')
    .lean();
  
  if (!faculty) {
    return next(new AppError('Faculty not found', 404));
  }
  
  // Get assigned courses for current semester
  let assignedCourses = [];
  try {
    assignedCourses = await FacultySectionAssignment.find({
      faculty: facultyId,
      isActive: true
    })
      .populate('course', 'name courseCode')
      .populate('section', 'sectionName')
      .populate('semester', 'name')
      .populate('academicYear', 'yearName')
      .lean();
  } catch (error) {
    console.log('Error fetching assigned courses:', error.message);
  }
  
  // Get upcoming classes (from timetable)
  const today = new Date();
  const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
  
  let upcomingClasses = [];
  try {
    upcomingClasses = await Timetable.find({
      faculty: facultyId,
      dayOfWeek
    })
      .populate('course', 'name courseCode')
      .populate('room', 'roomNumber building')
      .populate('sections', 'sectionName')
      .sort({ period: 1 })
      .lean();
  } catch (error) {
    console.log('Error fetching upcoming classes:', error.message);
  }
  
  // Get attendance statistics
  let totalAttendanceRecords = 0;
  try {
    totalAttendanceRecords = await Attendance.countDocuments({
      faculty: facultyId
    });
  } catch (error) {
    console.log('Error fetching attendance records count:', error.message);
  }
  
  // Recent attendance updates
  let recentAttendanceUpdates = [];
  try {
    recentAttendanceUpdates = await AttendanceBatchUpdate.find({
      faculty: facultyId
    })
      .populate('course', 'name courseCode')
      .populate('section', 'sectionName')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
  } catch (error) {
    console.log('Error fetching recent attendance updates:', error.message);
  }
  
  // Library books due (if linked to user)
  let libraryDue = [];
  if (faculty.user) {
    try {
      libraryDue = await LibraryTransaction.find({
        user: faculty.user,
        status: { $in: ['issued', 'overdue'] }
      })
        .populate('book', 'title author')
        .sort({ dueDate: 1 })
        .lean();
    } catch (error) {
      console.log('Error fetching library due:', error.message);
    }
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      faculty,
      assignedCourses,
      upcomingClasses,
      totalAttendanceRecords,
      recentAttendanceUpdates,
      libraryDue
    }
  });
});

/**
 * Get student dashboard data
 * @route GET /api/dashboard/student/:studentId
 * @access Student
 */
exports.getStudentDashboard = catchAsync(async (req, res, next) => {
  const { studentId } = req.params;
  
  // Get student details
  const student = await Student.findById(studentId)
    .populate('program', 'name')
    .populate('branch', 'name')
    .populate('batch', 'name')
    .populate('currentSemester', 'name')
    .lean();
  
  if (!student) {
    return next(new AppError('Student not found', 404));
  }
  
  // Get current semester courses
  let enrolledCourses = [];
  try {
    if (student.currentSemester) {
      enrolledCourses = await StudentSectionAssignment.find({
        student: studentId,
        semester: student.currentSemester,
        isActive: true
      })
        .populate('course', 'name courseCode credits')
        .populate('section', 'sectionName')
        .lean();
    }
  } catch (error) {
    console.log('Error fetching enrolled courses:', error.message);
  }
  
  // Get attendance summary
  let attendanceSummary = [];
  try {
    if (student.currentSemester) {
      attendanceSummary = await AttendanceSummary.find({
        student: studentId,
        semester: student.currentSemester
      })
        .populate('course', 'name courseCode')
        .populate('section', 'sectionName')
        .lean();
    }
  } catch (error) {
    console.log('Error fetching attendance summary:', error.message);
  }
  
  // Get upcoming classes (from timetable)
  const today = new Date();
  const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
  
  let upcomingClasses = [];
  try {
    if (enrolledCourses.length > 0) {
      // Extract course and section IDs from enrolled courses
      const courseIds = enrolledCourses.map(ec => ec.course._id);
      const sectionIds = enrolledCourses.map(ec => ec.section._id);
      
      upcomingClasses = await Timetable.find({
        course: { $in: courseIds },
        sections: { $in: sectionIds },
        dayOfWeek
      })
        .populate('course', 'name courseCode')
        .populate('faculty', 'firstName lastName')
        .populate('room', 'roomNumber building')
        .sort({ period: 1 })
        .lean();
    }
  } catch (error) {
    console.log('Error fetching upcoming classes:', error.message);
  }
  
  // Get pending fee invoices
  let pendingFees = [];
  try {
    pendingFees = await StudentFeeInvoice.find({
      student: studentId,
      status: { $in: ['pending', 'partially_paid', 'overdue'] }
    })
      .sort({ dueDate: 1 })
      .lean();
  } catch (error) {
    console.log('Error fetching pending fees:', error.message);
  }
  
  // Get recent exam results
  let examResults = [];
  try {
    if (student.currentSemester) {
      examResults = await StudentCourseResult.find({
        student: studentId,
        semester: student.currentSemester
      })
        .populate('course', 'name courseCode credits')
        .sort({ recordedAt: -1 })
        .lean();
    }
  } catch (error) {
    console.log('Error fetching exam results:', error.message);
  }
  
  // Library books due (if linked to user)
  let libraryDue = [];
  if (student.user) {
    try {
      libraryDue = await LibraryTransaction.find({
        user: student.user,
        status: { $in: ['issued', 'overdue'] }
      })
        .populate('book', 'title author')
        .sort({ dueDate: 1 })
        .lean();
    } catch (error) {
      console.log('Error fetching library due:', error.message);
    }
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      student,
      enrolledCourses,
      attendanceSummary,
      upcomingClasses,
      pendingFees,
      examResults,
      libraryDue
    }
  });
});

/**
 * Generate custom reports
 * @route POST /api/dashboard/reports
 * @access Admin, HOD
 */
exports.generateReport = catchAsync(async (req, res, next) => {
  const { reportType, filters, format } = req.body;
  
  let reportData = null;
  
  // Generate different reports based on type
  switch (reportType) {
    case 'student_attendance':
      reportData = await generateStudentAttendanceReport(filters);
      break;
    case 'fee_collection':
      reportData = await generateFeeCollectionReport(filters);
      break;
    case 'course_performance':
      reportData = await generateCoursePerformanceReport(filters);
      break;
    case 'faculty_workload':
      reportData = await generateFacultyWorkloadReport(filters);
      break;
    default:
      return next(new AppError('Invalid report type', 400));
  }
  
  // Format report according to requested format
  if (format === 'csv') {
    // This would be implemented with CSV generation
    res.status(200).json({
      status: 'success',
      message: 'CSV format not implemented yet',
      data: {
        reportType,
        reportData
      }
    });
  } else {
    // Default JSON format
    res.status(200).json({
      status: 'success',
      data: {
        reportType,
        reportData
      }
    });
  }
});

/**
 * Helper function to generate student attendance report
 * @param {Object} filters - Report filters
 */
async function generateStudentAttendanceReport(filters = {}) {
  try {
    // Extract filters
    const { batch, program, branch, semester, fromDate, toDate, minPercentage, maxPercentage } = filters;
    
    // Build pipeline
    const pipeline = [];
    
    // Match stage for filters
    const match = {};
    
    if (semester) {
      try {
        match.semester = new mongoose.Types.ObjectId(semester);
      } catch (error) {
        console.log('Invalid semester ID');
      }
    }
    
    if (fromDate || toDate) {
      match.lastUpdated = {};
      if (fromDate) match.lastUpdated.$gte = new Date(fromDate);
      if (toDate) match.lastUpdated.$lte = new Date(toDate);
    }
    
    if (minPercentage !== undefined || maxPercentage !== undefined) {
      match.attendancePercentage = {};
      if (minPercentage !== undefined) match.attendancePercentage.$gte = Number(minPercentage);
      if (maxPercentage !== undefined) match.attendancePercentage.$lte = Number(maxPercentage);
    }
    
    if (Object.keys(match).length > 0) {
      pipeline.push({ $match: match });
    }
    
    // Lookup student info
    pipeline.push({
      $lookup: {
        from: 'students',
        localField: 'student',
        foreignField: '_id',
        as: 'studentInfo'
      }
    });
    
    pipeline.push({ 
      $unwind: { 
        path: '$studentInfo',
        preserveNullAndEmptyArrays: true
      } 
    });
    
    // Additional filters on student fields
    if (batch || program || branch) {
      const studentMatch = {};
      
      if (batch) {
        try {
          studentMatch['studentInfo.batch'] = new mongoose.Types.ObjectId(batch);
        } catch (error) {
          console.log('Invalid batch ID');
        }
      }
      
      if (program) {
        try {
          studentMatch['studentInfo.program'] = new mongoose.Types.ObjectId(program);
        } catch (error) {
          console.log('Invalid program ID');
        }
      }
      
      if (branch) {
        try {
          studentMatch['studentInfo.branch'] = new mongoose.Types.ObjectId(branch);
        } catch (error) {
          console.log('Invalid branch ID');
        }
      }
      
      if (Object.keys(studentMatch).length > 0) {
        pipeline.push({ $match: studentMatch });
      }
    }
    
    // Lookup course info
    pipeline.push({
      $lookup: {
        from: 'courses',
        localField: 'course',
        foreignField: '_id',
        as: 'courseInfo'
      }
    });
    
    pipeline.push({ 
      $unwind: { 
        path: '$courseInfo',
        preserveNullAndEmptyArrays: true
      } 
    });
    
    // Project fields for output
    pipeline.push({
      $project: {
        student: {
          id: '$studentInfo._id',
          name: '$studentInfo.name',
          admissionNo: '$studentInfo.admissionNo'
        },
        course: {
          id: '$courseInfo._id',
          name: '$courseInfo.name',
          courseCode: '$courseInfo.courseCode'
        },
        totalClasses: 1,
        classesAttended: 1,
        attendancePercentage: 1,
        attendanceStatus: 1,
        lastUpdated: 1
      }
    });
    
    // Sort by attendance percentage
    pipeline.push({ $sort: { attendancePercentage: 1 } });
    
    // Execute pipeline
    return await AttendanceSummary.aggregate(pipeline);
  } catch (error) {
    console.log('Error generating student attendance report:', error.message);
    return [];
  }
}

/**
 * Helper function to generate fee collection report
 * @param {Object} filters - Report filters
 */
async function generateFeeCollectionReport(filters = {}) {
  try {
    // Extract filters
    const { fromDate, toDate, program, batch } = filters;
    
    // Build pipeline
    const pipeline = [];
    
    // Match stage for filters
    const match = {};
    
    if (fromDate || toDate) {
      match.paymentDate = {};
      if (fromDate) match.paymentDate.$gte = new Date(fromDate);
      if (toDate) match.paymentDate.$lte = new Date(toDate);
    }
    
    if (Object.keys(match).length > 0) {
      pipeline.push({ $match: match });
    }
    
    // Lookup invoice info to get student
    pipeline.push({
      $lookup: {
        from: 'studentfeeinvoices',
        localField: 'invoice',
        foreignField: '_id',
        as: 'invoiceInfo'
      }
    });
    
    pipeline.push({ 
      $unwind: { 
        path: '$invoiceInfo',
        preserveNullAndEmptyArrays: true
      } 
    });
    
    // Lookup student info
    pipeline.push({
      $lookup: {
        from: 'students',
        localField: 'invoiceInfo.student',
        foreignField: '_id',
        as: 'studentInfo'
      }
    });
    
    pipeline.push({ 
      $unwind: { 
        path: '$studentInfo',
        preserveNullAndEmptyArrays: true
      } 
    });
    
    // Additional filters on student fields
    if (program || batch) {
      const studentMatch = {};
      
      if (program) {
        try {
          studentMatch['studentInfo.program'] = new mongoose.Types.ObjectId(program);
        } catch (error) {
          console.log('Invalid program ID');
        }
      }
      
      if (batch) {
        try {
          studentMatch['studentInfo.batch'] = new mongoose.Types.ObjectId(batch);
        } catch (error) {
          console.log('Invalid batch ID');
        }
      }
      
      if (Object.keys(studentMatch).length > 0) {
        pipeline.push({ $match: studentMatch });
      }
    }
    
    // Group by payment date
    pipeline.push({
      $group: {
        _id: {
          year: { $year: '$paymentDate' },
          month: { $month: '$paymentDate' },
          day: { $dayOfMonth: '$paymentDate' }
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    });
    
    // Format for output
    pipeline.push({
      $project: {
        _id: 0,
        date: {
          $dateToString: { 
            format: '%Y-%m-%d', 
            date: { 
              $dateFromParts: { 
                year: '$_id.year', 
                month: '$_id.month', 
                day: '$_id.day' 
              } 
            } 
          }
        },
        totalAmount: 1,
        count: 1
      }
    });
    
    // Sort by date
    pipeline.push({ $sort: { date: 1 } });
    
    // Execute pipeline
    return await StudentFeePayment.aggregate(pipeline);
  } catch (error) {
    console.log('Error generating fee collection report:', error.message);
    return [];
  }
}

/**
 * Helper function to generate course performance report
 * @param {Object} filters - Report filters
 */
async function generateCoursePerformanceReport(filters = {}) {
  try {
    // Extract filters
    const { course, semester, academicYear } = filters;
    
    // Build pipeline
    const pipeline = [];
    
    // Match stage for filters
    const match = {};
    
    if (course) {
      try {
        match.course = new mongoose.Types.ObjectId(course);
      } catch (error) {
        console.log('Invalid course ID');
      }
    }
    
    if (semester) {
      try {
        match.semester = new mongoose.Types.ObjectId(semester);
      } catch (error) {
        console.log('Invalid semester ID');
      }
    }
    
    if (academicYear) {
      try {
        match.academicYear = new mongoose.Types.ObjectId(academicYear);
      } catch (error) {
        console.log('Invalid academicYear ID');
      }
    }
    
    if (Object.keys(match).length > 0) {
      pipeline.push({ $match: match });
    }
    
    // Group by course and result status
    pipeline.push({
      $group: {
        _id: {
          course: '$course',
          resultStatus: '$resultStatus'
        },
        count: { $sum: 1 },
        averageGradePoint: { $avg: '$gradePoint' }
      }
    });
    
    // Lookup course info
    pipeline.push({
      $lookup: {
        from: 'courses',
        localField: '_id.course',
        foreignField: '_id',
        as: 'courseInfo'
      }
    });
    
    pipeline.push({ 
      $unwind: { 
        path: '$courseInfo',
        preserveNullAndEmptyArrays: true
      } 
    });
    
    // Format for output
    pipeline.push({
      $project: {
        _id: 0,
        course: {
          id: '$courseInfo._id',
          name: '$courseInfo.name',
          courseCode: '$courseInfo.courseCode'
        },
        resultStatus: '$_id.resultStatus',
        count: 1,
        averageGradePoint: { $round: ['$averageGradePoint', 2] }
      }
    });
    
    // Sort by course name and result status
    pipeline.push({ $sort: { 'course.name': 1, resultStatus: 1 } });
    
    // Execute pipeline
    return await StudentCourseResult.aggregate(pipeline);
  } catch (error) {
    console.log('Error generating course performance report:', error.message);
    return [];
  }
}

/**
 * Helper function to generate faculty workload report
 * @param {Object} filters - Report filters
 */
async function generateFacultyWorkloadReport(filters = {}) {
  try {
    // Extract filters
    const { department, semester, academicYear } = filters;
    
    // Build pipeline
    const pipeline = [];
    
    // Match stage for filters
    const match = {};
    
    if (semester) {
      try {
        match.semester = new mongoose.Types.ObjectId(semester);
      } catch (error) {
        console.log('Invalid semester ID');
      }
    }
    
    if (academicYear) {
      try {
        match.academicYear = new mongoose.Types.ObjectId(academicYear);
      } catch (error) {
        console.log('Invalid academicYear ID');
      }
    }
    
    // Apply initial match if necessary
    if (Object.keys(match).length > 0) {
      pipeline.push({ $match: match });
    }
    
    // Group by faculty
    pipeline.push({
      $group: {
        _id: '$faculty',
        assignmentCount: { $sum: 1 },
        courses: { $addToSet: '$course' }
      }
    });
    
    // Lookup faculty info
    pipeline.push({
      $lookup: {
        from: 'faculties',
        localField: '_id',
        foreignField: '_id',
        as: 'facultyInfo'
      }
    });
    
    pipeline.push({ 
      $unwind: { 
        path: '$facultyInfo',
        preserveNullAndEmptyArrays: true 
      } 
    });
    
    // Filter by department if specified
    if (department) {
      try {
        pipeline.push({ 
          $match: { 
            'facultyInfo.department': new mongoose.Types.ObjectId(department)
          } 
        });
      } catch (error) {
        console.log('Invalid department ID');
      }
    }
    
    // Lookup department info
    pipeline.push({
      $lookup: {
        from: 'departments',
        localField: 'facultyInfo.department',
        foreignField: '_id',
        as: 'departmentInfo'
      }
    });
    
    pipeline.push({ 
      $unwind: { 
        path: '$departmentInfo',
        preserveNullAndEmptyArrays: true 
      } 
    });
    
    // Format for output
    pipeline.push({
      $project: {
        _id: 0,
        faculty: {
          id: '$facultyInfo._id',
          name: { $concat: ['$facultyInfo.firstName', ' ', '$facultyInfo.lastName'] },
          designation: '$facultyInfo.designation'
        },
        department: {
          id: '$departmentInfo._id',
          name: '$departmentInfo.name',
          code: '$departmentInfo.code'
        },
        assignmentCount: 1,
        courseCount: { $size: '$courses' }
      }
    });
    
    // Sort by department and faculty name
    pipeline.push({ $sort: { 'department.name': 1, 'faculty.name': 1 } });
    
    // Execute pipeline
    return await FacultySectionAssignment.aggregate(pipeline);
  } catch (error) {
    console.log('Error generating faculty workload report:', error.message);
    return [];
  }
}