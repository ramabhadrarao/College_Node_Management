// controllers/exam.controller.js
const ExamSchedule = require('../models/ExamSchedule');
const ExamType = require('../models/ExamType');
const StudentExamMark = require('../models/StudentExamMark');
const StudentCourseResult = require('../models/StudentCourseResult');
const SemesterResult = require('../models/SemesterResult');
const CumulativeResult = require('../models/CumulativeResult');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Create exam type
exports.createExamType = catchAsync(async (req, res, next) => {
  const { name, description } = req.body;
  
  const examType = await ExamType.create({
    name,
    description
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      examType
    }
  });
});

// Get exam types
exports.getExamTypes = catchAsync(async (req, res, next) => {
  const examTypes = await ExamType.find().sort({ name: 1 });
  
  res.status(200).json({
    status: 'success',
    results: examTypes.length,
    data: {
      examTypes
    }
  });
});

// Create exam schedule
exports.createExamSchedule = catchAsync(async (req, res, next) => {
  const {
    examType,
    course,
    semester,
    academicYear,
    examDate,
    examStartTime,
    examEndTime,
    examVenue,
    facultyAssigned,
    maxMarks
  } = req.body;
  
  const examSchedule = await ExamSchedule.create({
    examType,
    course,
    semester,
    academicYear,
    examDate: new Date(examDate),
    examStartTime,
    examEndTime,
    examVenue,
    facultyAssigned,
    maxMarks
  });
  
  // Populate references for response
  await examSchedule
    .populate('examType', 'name')
    .populate('course', 'name courseCode')
    .populate('semester', 'name')
    .populate('academicYear', 'yearName')
    .populate('facultyAssigned', 'firstName lastName');
  
  res.status(201).json({
    status: 'success',
    data: {
      examSchedule
    }
  });
});

// Get exam schedules
exports.getExamSchedules = catchAsync(async (req, res, next) => {
  const { examType, course, semester, academicYear, fromDate, toDate } = req.query;
  
  // Build query
  const query = {};
  if (examType) query.examType = examType;
  if (course) query.course = course;
  if (semester) query.semester = semester;
  if (academicYear) query.academicYear = academicYear;
  
  // Date range filter
  if (fromDate || toDate) {
    query.examDate = {};
    if (fromDate) query.examDate.$gte = new Date(fromDate);
    if (toDate) query.examDate.$lte = new Date(toDate);
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  
  // Execute query
  const [examSchedules, total] = await Promise.all([
    ExamSchedule.find(query)
      .populate('examType', 'name')
      .populate('course', 'name courseCode')
      .populate('semester', 'name')
      .populate('academicYear', 'yearName')
      .populate('facultyAssigned', 'firstName lastName')
      .sort({ examDate: 1, examStartTime: 1 })
      .skip(skip)
      .limit(limit),
    ExamSchedule.countDocuments(query)
  ]);
  
  res.status(200).json({
    status: 'success',
    results: examSchedules.length,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    },
    data: {
      examSchedules
    }
  });
});

// Enter exam marks
exports.enterExamMarks = catchAsync(async (req, res, next) => {
  const { studentMarks } = req.body;
  
  if (!studentMarks || !Array.isArray(studentMarks) || studentMarks.length === 0) {
    return next(new AppError('Student marks data is required', 400));
  }
  
  // Process each student's marks
  const results = [];
  
  for (const mark of studentMarks) {
    // Check if this is an update or new entry
    const existingMark = await StudentExamMark.findOne({
      student: mark.student,
      course: mark.course,
      examType: mark.examType
    });
    
    if (existingMark) {
      // Update existing mark
      existingMark.marksObtained = mark.marksObtained;
      existingMark.maxMarks = mark.maxMarks;
      existingMark.remarks = mark.remarks;
      existingMark.recordedBy = req.user.id;
      existingMark.recordedAt = new Date();
      
      await existingMark.save();
      results.push(existingMark);
    } else {
      // Create new mark entry
      const newMark = await StudentExamMark.create({
        student: mark.student,
        course: mark.course,
        examType: mark.examType,
        semester: mark.semester,
        academicYear: mark.academicYear,
        marksObtained: mark.marksObtained,
        maxMarks: mark.maxMarks,
        remarks: mark.remarks,
        recordedBy: req.user.id,
        recordedAt: new Date()
      });
      
      results.push(newMark);
    }
  }
  
  res.status(200).json({
    status: 'success',
    message: `${results.length} student marks recorded successfully`,
    data: {
      results
    }
  });
});

// Get student exam marks
exports.getStudentExamMarks = catchAsync(async (req, res, next) => {
  const { studentId } = req.params;
  const { course, examType, semester, academicYear } = req.query;
  
  // Build query
  const query = { student: studentId };
  if (course) query.course = course;
  if (examType) query.examType = examType;
  if (semester) query.semester = semester;
  if (academicYear) query.academicYear = academicYear;
  
  // Execute query
  const examMarks = await StudentExamMark.find(query)
    .populate('course', 'name courseCode')
    .populate('examType', 'name')
    .populate('semester', 'name')
    .populate('academicYear', 'yearName')
    .sort({ recordedAt: -1 });
  
  res.status(200).json({
    status: 'success',
    results: examMarks.length,
    data: {
      examMarks
    }
  });
});

// Calculate and update course result
exports.calculateCourseResult = catchAsync(async (req, res, next) => {
  const { student, course, semester, academicYear } = req.body;
  
  // Get all exam marks for this student and course
  const examMarks = await StudentExamMark.find({
    student,
    course,
    semester,
    academicYear
  }).populate('examType');
  
  if (examMarks.length === 0) {
    return next(new AppError('No exam marks found for this student and course', 404));
  }
  
  // Calculate total marks (simplified approach - would be more complex based on exam weightage)
  let totalMarks = 0;
  let maxPossibleMarks = 0;
  
  examMarks.forEach(mark => {
    totalMarks += mark.marksObtained;
    maxPossibleMarks += mark.maxMarks;
  });
  
  const percentage = (totalMarks / maxPossibleMarks) * 100;
  
  // Determine grade (simplified - would use grade scale from database)
  let grade, gradePoint;
  
  if (percentage >= 90) {
    grade = 'A+';
    gradePoint = 10;
  } else if (percentage >= 80) {
    grade = 'A';
    gradePoint = 9;
  } else if (percentage >= 70) {
    grade = 'B';
    gradePoint = 8;
  } else if (percentage >= 60) {
    grade = 'C';
    gradePoint = 7;
  } else if (percentage >= 50) {
    grade = 'D';
    gradePoint = 6;
  } else if (percentage >= 40) {
    grade = 'E';
    gradePoint = 5;
  } else {
    grade = 'F';
    gradePoint = 0;
  }
  
  // Determine result status
  const resultStatus = percentage >= 40 ? 'Passed' : 'Failed';
  
  // Get course credits (simplified)
  const courseInfo = await Course.findById(course);
  const creditsEarned = resultStatus === 'Passed' ? courseInfo.credits : 0;
  
  // Update or create course result
  const courseResult = await StudentCourseResult.findOneAndUpdate(
    {
      student,
      course,
      semester,
      academicYear
    },
    {
      totalMarks,
      grade,
      gradePoint,
      creditsEarned,
      resultStatus,
      recordedBy: req.user.id,
      recordedAt: new Date()
    },
    { upsert: true, new: true }
  );
  
  res.status(200).json({
    status: 'success',
    data: {
      courseResult
    }
  });
});

// Calculate semester result
exports.calculateSemesterResult = catchAsync(async (req, res, next) => {
  const { student, semester, academicYear } = req.body;
  
  // Get all course results for this student in this semester
  const courseResults = await StudentCourseResult.find({
    student,
    semester,
    academicYear
  }).populate('course');
  
  if (courseResults.length === 0) {
    return next(new AppError('No course results found for this student in this semester', 404));
  }
  
  // Calculate SGPA and totals
  let totalCredits = 0;
  let creditsEarned = 0;
  let gradePointTotal = 0;
  
  courseResults.forEach(result => {
    const courseCredits = result.course.credits;
    totalCredits += courseCredits;
    creditsEarned += result.creditsEarned;
    gradePointTotal += result.gradePoint * courseCredits;
  });
  
  const sgpa = totalCredits > 0 ? gradePointTotal / totalCredits : 0;
  
  // Determine result status
  const resultStatus = creditsEarned === totalCredits ? 'Completed' : 'Incomplete';
  
  // Update or create semester result
  const semesterResult = await SemesterResult.findOneAndUpdate(
    {
      student,
      semester,
      academicYear
    },
    {
      totalCredits,
      creditsEarned,
      sgpa,
      resultStatus,
      generatedAt: new Date()
    },
    { upsert: true, new: true }
  );
  
  res.status(200).json({
    status: 'success',
    data: {
      semesterResult
    }
  });
});

// Calculate cumulative result
exports.calculateCumulativeResult = catchAsync(async (req, res, next) => {
  const { student, upToSemester } = req.body;
  
  // Get all semester results up to the specified semester
  // This requires knowing semester order - simplified approach here
  const semesterResults = await SemesterResult.find({
    student,
    semester: { $lte: upToSemester } // Assuming semester IDs increase in order
  });
  
  if (semesterResults.length === 0) {
    return next(new AppError('No semester results found for this student', 404));
  }
  
  // Calculate CGPA and totals
  let totalCredits = 0;
  let creditsEarned = 0;
  let gradePointTotal = 0;
  
  semesterResults.forEach(result => {
    totalCredits += result.totalCredits;
    creditsEarned += result.creditsEarned;
    gradePointTotal += result.sgpa * result.totalCredits;
  });
  
  const cgpa = totalCredits > 0 ? gradePointTotal / totalCredits : 0;
  
  // Update or create cumulative result
  const cumulativeResult = await CumulativeResult.findOneAndUpdate(
    {
      student,
      upToSemester
    },
    {
      totalCredits,
      creditsEarned,
      cgpa,
      resultStatus: 'In Progress', // Would need logic to determine if graduated
      lastUpdated: new Date()
    },
    { upsert: true, new: true }
  );
  
  res.status(200).json({
    status: 'success',
    data: {
      cumulativeResult
    }
  });
});

// Get student results
exports.getStudentResults = catchAsync(async (req, res, next) => {
  const { studentId } = req.params;
  
  // Get course results
  const courseResults = await StudentCourseResult.find({ student: studentId })
    .populate('course', 'name courseCode credits')
    .populate('semester', 'name')
    .populate('academicYear', 'yearName')
    .sort({ 'academicYear.yearName': -1, 'semester.name': -1 });
  
  // Get semester results
  const semesterResults = await SemesterResult.find({ student: studentId })
    .populate('semester', 'name')
    .populate('academicYear', 'yearName')
    .sort({ 'academicYear.yearName': -1, 'semester.name': -1 });
  
  // Get latest cumulative result
  const cumulativeResult = await CumulativeResult.findOne({ student: studentId })
    .populate('upToSemester', 'name')
    .sort({ lastUpdated: -1 });
  
  res.status(200).json({
    status: 'success',
    data: {
      courseResults,
      semesterResults,
      cumulativeResult
    }
  });
});

// Generate grade card
exports.generateGradeCard = catchAsync(async (req, res, next) => {
  const { studentId, semester, academicYear } = req.params;
  
  // Get student details
  const student = await Student.findById(studentId)
    .populate('program', 'name')
    .populate('branch', 'name')
    .populate('batch', 'name');
  
  if (!student) {
    return next(new AppError('Student not found', 404));
  }
  
  // Get semester details
  const semesterInfo = await Semester.findById(semester)
    .populate('academicYear', 'yearName');
  
  if (!semesterInfo) {
    return next(new AppError('Semester not found', 404));
  }
  
  // Get course results
  const courseResults = await StudentCourseResult.find({
    student: studentId,
    semester,
    academicYear
  }).populate('course', 'name courseCode credits');
  
  // Get semester result
  const semesterResult = await SemesterResult.findOne({
    student: studentId,
    semester,
    academicYear
  });
  
  // Get cumulative result
  const cumulativeResult = await CumulativeResult.findOne({
    student: studentId,
    upToSemester: semester
  });
  
  // Build grade card data
  const gradeCard = {
    student: {
      name: student.name,
      admissionNo: student.admissionNo,
      program: student.program.name,
      branch: student.branch.name,
      batch: student.batch.name
    },
    semester: {
      name: semesterInfo.name,
      academicYear: semesterInfo.academicYear.yearName
    },
    courses: courseResults.map(result => ({
      code: result.course.courseCode,
      name: result.course.name,
      credits: result.course.credits,
      grade: result.grade,
      gradePoint: result.gradePoint,
      status: result.resultStatus
    })),
    summary: {
      totalCredits: semesterResult ? semesterResult.totalCredits : 0,
      creditsEarned: semesterResult ? semesterResult.creditsEarned : 0,
      sgpa: semesterResult ? semesterResult.sgpa : 0,
      status: semesterResult ? semesterResult.resultStatus : 'Incomplete',
      cgpa: cumulativeResult ? cumulativeResult.cgpa : 0
    },
    generatedAt: new Date()
  };
  
  res.status(200).json({
    status: 'success',
    data: {
      gradeCard
    }
  });
});