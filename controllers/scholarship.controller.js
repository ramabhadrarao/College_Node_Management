// controllers/scholarship.controller.js
const mongoose = require('mongoose');
const StudentScholarship = require('../models/StudentScholarship');
const ScholarshipType = require('../models/ScholarshipType');
const Student = require('../models/Student');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const fileService = require('../services/fileService');
const notificationService = require('../services/notificationService');

/**
 * Get all scholarship types
 * @route GET /api/scholarships/types
 * @access Admin, Student
 */
exports.getAllScholarshipTypes = catchAsync(async (req, res, next) => {
  const scholarshipTypes = await ScholarshipType.find()
    .sort({ name: 1 });
  
  res.status(200).json({
    status: 'success',
    results: scholarshipTypes.length,
    data: {
      scholarshipTypes
    }
  });
});

/**
 * Create scholarship type
 * @route POST /api/scholarships/types
 * @access Admin
 */
exports.createScholarshipType = catchAsync(async (req, res, next) => {
  const { name, description, source, renewable, renewalCriteria, maxAmount } = req.body;
  
  const scholarshipType = await ScholarshipType.create({
    name,
    description,
    source,
    renewable: renewable === 'true' || renewable === true,
    renewalCriteria,
    maxAmount: parseFloat(maxAmount) || 0
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      scholarshipType
    }
  });
});

/**
 * Award scholarship to student
 * @route POST /api/scholarships/award
 * @access Admin
 */
exports.awardScholarship = catchAsync(async (req, res, next) => {
  const { studentId, scholarshipTypeId, academicYearId, semesterId, amount, referenceNumber, remarks } = req.body;
  
  // Validate student
  const student = await Student.findById(studentId);
  if (!student) {
    return next(new AppError('Student not found', 404));
  }
  
  // Validate scholarship type
  const scholarshipType = await ScholarshipType.findById(scholarshipTypeId);
  if (!scholarshipType) {
    return next(new AppError('Scholarship type not found', 404));
  }
  
  // Process attachment if provided
  let attachment = null;
  if (req.file) {
    attachment = await fileService.uploadFile(req.file, 'scholarships');
  }
  
  // Create scholarship record
  const scholarship = await StudentScholarship.create({
    student: studentId,
    scholarshipType: scholarshipTypeId,
    academicYear: academicYearId,
    semester: semesterId,
    amount: parseFloat(amount) || 0,
    awardedDate: new Date(),
    referenceNumber,
    attachment,
    remarks,
    status: 'active'
  });
  
  // Notify student
  if (student.user) {
    await notificationService.createNotification({
      userId: student.user,
      title: 'Scholarship Awarded',
      message: `Congratulations! You have been awarded the ${scholarshipType.name} scholarship of amount ${amount}.`,
      type: 'scholarship',
      relatedEntity: 'scholarship',
      relatedId: scholarship._id,
      sendEmail: true
    });
  }
  
  // Populate for response
  await scholarship
    .populate('student', 'name admissionNo')
    .populate('scholarshipType', 'name source')
    .populate('academicYear', 'yearName')
    .populate('semester', 'name');
  
  res.status(201).json({
    status: 'success',
    data: {
      scholarship
    }
  });
});

/**
 * Get student scholarships
 * @route GET /api/scholarships/student/:studentId
 * @access Admin, Student
 */
exports.getStudentScholarships = catchAsync(async (req, res, next) => {
  const { studentId } = req.params;
  
  const scholarships = await StudentScholarship.find({ student: studentId })
    .populate('scholarshipType', 'name source')
    .populate('academicYear', 'yearName')
    .populate('semester', 'name')
    .sort({ awardedDate: -1 });
  
  // Calculate total amount
  const totalAmount = scholarships.reduce((sum, scholarship) => sum + scholarship.amount, 0);
  
  res.status(200).json({
    status: 'success',
    results: scholarships.length,
    data: {
      scholarships,
      totalAmount
    }
  });
});

/**
 * Update scholarship status
 * @route PATCH /api/scholarships/:id/status
 * @access Admin
 */
exports.updateScholarshipStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status, remarks } = req.body;
  
  // Validate status
  if (!['active', 'inactive', 'revoked'].includes(status)) {
    return next(new AppError('Invalid status value', 400));
  }
  
  // Find scholarship
  const scholarship = await StudentScholarship.findById(id);
  
  if (!scholarship) {
    return next(new AppError('Scholarship not found', 404));
  }
  
  // Update scholarship
  scholarship.status = status;
  if (remarks) scholarship.remarks = remarks;
  
  await scholarship.save();
  
  // Notify student if scholarship is revoked
  if (status === 'revoked') {
    const student = await Student.findById(scholarship.student).populate('user');
    
    if (student && student.user) {
      await notificationService.createNotification({
        userId: student.user._id,
        title: 'Scholarship Status Update',
        message: `Your scholarship has been revoked. Reason: ${remarks || 'Not specified'}`,
        type: 'scholarship_update',
        relatedEntity: 'scholarship',
        relatedId: scholarship._id,
        sendEmail: true
      });
    }
  }
  
  // Populate for response
  await scholarship
    .populate('student', 'name admissionNo')
    .populate('scholarshipType', 'name source')
    .populate('academicYear', 'yearName')
    .populate('semester', 'name');
  
  res.status(200).json({
    status: 'success',
    data: {
      scholarship
    }
  });
});

/**
 * Generate scholarship report
 * @route GET /api/scholarships/report
 * @access Admin
 */
exports.generateScholarshipReport = catchAsync(async (req, res, next) => {
  const { academicYearId, scholarshipTypeId, status } = req.query;
  
  // Build aggregation pipeline
  const pipeline = [];
  
  // Match stage
  const match = {};
  if (academicYearId) match.academicYear = mongoose.Types.ObjectId(academicYearId);
  if (scholarshipTypeId) match.scholarshipType = mongoose.Types.ObjectId(scholarshipTypeId);
  if (status) match.status = status;
  
  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }
  
  // Lookup scholarship type
  pipeline.push({
    $lookup: {
      from: 'scholarshiptypes',
      localField: 'scholarshipType',
      foreignField: '_id',
      as: 'scholarshipTypeInfo'
    }
  });
  
  pipeline.push({ $unwind: '$scholarshipTypeInfo' });
  
  // Lookup student
  pipeline.push({
    $lookup: {
      from: 'students',
      localField: 'student',
      foreignField: '_id',
      as: 'studentInfo'
    }
  });
  
  pipeline.push({ $unwind: '$studentInfo' });
  
  // Lookup academic year
  pipeline.push({
    $lookup: {
      from: 'academicyears',
      localField: 'academicYear',
      foreignField: '_id',
      as: 'academicYearInfo'
    }
  });
  
  pipeline.push({
    $unwind: {
      path: '$academicYearInfo',
      preserveNullAndEmptyArrays: true
    }
  });
  
  // Group by scholarship type
  pipeline.push({
    $group: {
      _id: '$scholarshipType',
      scholarshipType: { $first: '$scholarshipTypeInfo.name' },
      source: { $first: '$scholarshipTypeInfo.source' },
      count: { $sum: 1 },
      totalAmount: { $sum: '$amount' },
      students: {
        $push: {
          id: '$studentInfo._id',
          name: '$studentInfo.name',
          admissionNo: '$studentInfo.admissionNo',
          amount: '$amount',
          awardedDate: '$awardedDate',
          status: '$status'
        }
      }
    }
  });
  
  // Sort by scholarship type
  pipeline.push({ $sort: { scholarshipType: 1 } });
  
  // Execute pipeline
  const scholarshipStats = await StudentScholarship.aggregate(pipeline);
  
  // Calculate overall totals
  const totalAwards = scholarshipStats.reduce((sum, stat) => sum + stat.count, 0);
  const totalAmount = scholarshipStats.reduce((sum, stat) => sum + stat.totalAmount, 0);
  
  res.status(200).json({
    status: 'success',
    data: {
      scholarshipStats,
      totalAwards,
      totalAmount
    }
  });
});