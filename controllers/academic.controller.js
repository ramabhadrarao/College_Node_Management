// controllers/academic.controller.js
const mongoose = require('mongoose');
const AcademicYear = require('../models/AcademicYear');
const Semester = require('../models/Semester');
const Batch = require('../models/Batch');
const WorkingDayAdjustment = require('../models/WorkingDayAdjustment');
const AcademicTerm = require('../models/AcademicTerm');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * Get all academic years
 * @route GET /api/academic/years
 * @access Admin, Faculty, Student
 */
exports.getAllAcademicYears = catchAsync(async (req, res, next) => {
  const { status } = req.query;
  
  // Build query
  const query = {};
  if (status) {
    query.status = status;
  }
  
  const academicYears = await AcademicYear.find(query)
    .sort({ startDate: -1 });
  
  res.status(200).json({
    status: 'success',
    results: academicYears.length,
    data: {
      academicYears
    }
  });
});

/**
 * Create academic year
 * @route POST /api/academic/years
 * @access Admin
 */
exports.createAcademicYear = catchAsync(async (req, res, next) => {
  const { yearName, startDate, endDate, status } = req.body;
  
  // Validate dates
  if (new Date(startDate) >= new Date(endDate)) {
    return next(new AppError('Start date must be before end date', 400));
  }
  
  // Check if academic year with same name exists
  const existingYear = await AcademicYear.findOne({ yearName });
  if (existingYear) {
    return next(new AppError('Academic year with this name already exists', 400));
  }
  
  // Create academic year
  const academicYear = await AcademicYear.create({
    yearName,
    startDate,
    endDate,
    status: status || 'upcoming'
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      academicYear
    }
  });
});

/**
 * Update academic year
 * @route PATCH /api/academic/years/:id
 * @access Admin
 */
exports.updateAcademicYear = catchAsync(async (req, res, next) => {
  const { yearName, startDate, endDate, status } = req.body;
  
  // Find academic year
  const academicYear = await AcademicYear.findById(req.params.id);
  
  if (!academicYear) {
    return next(new AppError('Academic year not found', 404));
  }
  
  // Update fields
  if (yearName) {
    // Check if name is unique
    const existingYear = await AcademicYear.findOne({
      _id: { $ne: req.params.id },
      yearName
    });
    
    if (existingYear) {
      return next(new AppError('Academic year with this name already exists', 400));
    }
    
    academicYear.yearName = yearName;
  }
  
  if (startDate) academicYear.startDate = startDate;
  if (endDate) academicYear.endDate = endDate;
  if (status) academicYear.status = status;
  
  // Validate dates
  if (academicYear.startDate >= academicYear.endDate) {
    return next(new AppError('Start date must be before end date', 400));
  }
  
  // Save changes
  await academicYear.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      academicYear
    }
  });
});

/**
 * Get all semesters
 * @route GET /api/academic/semesters
 * @access Admin, Faculty, Student
 */
exports.getAllSemesters = catchAsync(async (req, res, next) => {
  const { academicYear, status } = req.query;
  
  // Build query
  const query = {};
  if (academicYear) query.academicYear = academicYear;
  if (status) query.status = status;
  
  const semesters = await Semester.find(query)
    .populate('academicYear', 'yearName')
    .populate('regulation', 'name code')
    .sort({ startDate: -1 });
  
  res.status(200).json({
    status: 'success',
    results: semesters.length,
    data: {
      semesters
    }
  });
});

/**
 * Create semester
 * @route POST /api/academic/semesters
 * @access Admin
 */
exports.createSemester = catchAsync(async (req, res, next) => {
  const { name, academicYear, regulation, startDate, endDate, status } = req.body;
  
  // Validate academic year
  const academicYearObj = await AcademicYear.findById(academicYear);
  if (!academicYearObj) {
    return next(new AppError('Academic year not found', 404));
  }
  
  // Validate dates
  if (new Date(startDate) >= new Date(endDate)) {
    return next(new AppError('Start date must be before end date', 400));
  }
  
  // Create semester
  const semester = await Semester.create({
    name,
    academicYear,
    regulation,
    startDate,
    endDate,
    status: status || 'upcoming'
  });
  
  // Populate for response
  await semester
    .populate('academicYear', 'yearName')
    .populate('regulation', 'name code');
  
  res.status(201).json({
    status: 'success',
    data: {
      semester
    }
  });
});

/**
 * Update semester status
 * @route PATCH /api/academic/semesters/:id/status
 * @access Admin
 */
exports.updateSemesterStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  
  // Validate status
  if (!['upcoming', 'active', 'completed'].includes(status)) {
    return next(new AppError('Invalid status value', 400));
  }
  
  const semester = await Semester.findById(req.params.id);
  
  if (!semester) {
    return next(new AppError('Semester not found', 404));
  }
  
  // If setting to active, ensure no other semester is active for the same academic year
  if (status === 'active') {
    const activeSemester = await Semester.findOne({
      _id: { $ne: req.params.id },
      academicYear: semester.academicYear,
      status: 'active'
    });
    
    if (activeSemester) {
      return next(new AppError('Another semester is already active for this academic year', 400));
    }
  }
  
  // Update status
  semester.status = status;
  await semester.save();
  
  // Populate for response
  await semester
    .populate('academicYear', 'yearName')
    .populate('regulation', 'name code');
  
  res.status(200).json({
    status: 'success',
    data: {
      semester
    }
  });
});

/**
 * Get all batches
 * @route GET /api/academic/batches
 * @access Admin, Faculty, Student
 */
exports.getAllBatches = catchAsync(async (req, res, next) => {
  const { program, branch, status } = req.query;
  
  // Build query
  const query = {};
  if (program) query.program = program;
  if (branch) query.branch = branch;
  if (status) query.status = status;
  
  const batches = await Batch.find(query)
    .populate('program', 'name code')
    .populate('branch', 'name code')
    .populate('mentor', 'firstName lastName')
    .sort({ startYear: -1 });
  
  res.status(200).json({
    status: 'success',
    results: batches.length,
    data: {
      batches
    }
  });
});

/**
 * Create batch
 * @route POST /api/academic/batches
 * @access Admin
 */
exports.createBatch = catchAsync(async (req, res, next) => {
  const { name, program, branch, startYear, endYear, mentor, status } = req.body;
  
  // Validate years
  if (parseInt(startYear) >= parseInt(endYear)) {
    return next(new AppError('Start year must be before end year', 400));
  }
  
  // Check if batch with same name exists
  const existingBatch = await Batch.findOne({ name });
  if (existingBatch) {
    return next(new AppError('Batch with this name already exists', 400));
  }
  
  // Create batch
  const batch = await Batch.create({
    name,
    program,
    branch,
    startYear: parseInt(startYear),
    endYear: parseInt(endYear),
    mentor,
    status: status || 'active'
  });
  
  // Populate for response
  await batch
    .populate('program', 'name code')
    .populate('branch', 'name code')
    .populate('mentor', 'firstName lastName');
  
  res.status(201).json({
    status: 'success',
    data: {
      batch
    }
  });
});

/**
 * Update batch
 * @route PATCH /api/academic/batches/:id
 * @access Admin
 */
exports.updateBatch = catchAsync(async (req, res, next) => {
  const batch = await Batch.findById(req.params.id);
  
  if (!batch) {
    return next(new AppError('Batch not found', 404));
  }
  
  // Update fields
  const allowedFields = ['name', 'program', 'branch', 'startYear', 'endYear', 'mentor', 'status'];
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      batch[field] = req.body[field];
    }
  });
  
  // Handle parsing years
  if (req.body.startYear) batch.startYear = parseInt(req.body.startYear);
  if (req.body.endYear) batch.endYear = parseInt(req.body.endYear);
  
  // Validate years
  if (batch.startYear >= batch.endYear) {
    return next(new AppError('Start year must be before end year', 400));
  }
  
  // Save changes
  await batch.save();
  
  // Populate for response
  await batch
    .populate('program', 'name code')
    .populate('branch', 'name code')
    .populate('mentor', 'firstName lastName');
  
  res.status(200).json({
    status: 'success',
    data: {
      batch
    }
  });
});

/**
 * Create working day adjustment (e.g., Saturday as Monday)
 * @route POST /api/academic/working-day-adjustments
 * @access Admin
 */
exports.createWorkingDayAdjustment = catchAsync(async (req, res, next) => {
  const { academicYear, adjustmentDate, adjustmentType, reason } = req.body;
  
  // Validate academic year
  const academicYearObj = await AcademicYear.findById(academicYear);
  if (!academicYearObj) {
    return next(new AppError('Academic year not found', 404));
  }
  
  // Validate adjustment type
  if (!['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(adjustmentType)) {
    return next(new AppError('Invalid adjustment type', 400));
  }
  
  // Check if adjustment already exists for this date
  const existingAdjustment = await WorkingDayAdjustment.findOne({
    academicYear,
    adjustmentDate: new Date(adjustmentDate)
  });
  
  if (existingAdjustment) {
    return next(new AppError('Adjustment already exists for this date', 400));
  }
  
  // Create adjustment
  const adjustment = await WorkingDayAdjustment.create({
    academicYear,
    adjustmentDate: new Date(adjustmentDate),
    adjustmentType,
    reason
  });
  
  // Populate for response
  await adjustment.populate('academicYear', 'yearName');
  
  res.status(201).json({
    status: 'success',
    data: {
      adjustment
    }
  });
});

/**
 * Get working day adjustments
 * @route GET /api/academic/working-day-adjustments
 * @access Admin, Faculty, Student
 */
exports.getWorkingDayAdjustments = catchAsync(async (req, res, next) => {
  const { academicYear, month, year } = req.query;
  
  // Build query
  const query = {};
  
  if (academicYear) {
    query.academicYear = academicYear;
  }
  
  // Filter by month and year if provided
  if (month && year) {
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);
    
    query.adjustmentDate = {
      $gte: startDate,
      $lte: endDate
    };
  }
  
  const adjustments = await WorkingDayAdjustment.find(query)
    .populate('academicYear', 'yearName')
    .sort({ adjustmentDate: 1 });
  
  res.status(200).json({
    status: 'success',
    results: adjustments.length,
    data: {
      adjustments
    }
  });
});

/**
 * Create academic term (e.g., midterm, final)
 * @route POST /api/academic/terms
 * @access Admin
 */
exports.createAcademicTerm = catchAsync(async (req, res, next) => {
  const { name, semester, startDate, endDate, isActive } = req.body;
  
  // Validate semester
  const semesterObj = await Semester.findById(semester);
  if (!semesterObj) {
    return next(new AppError('Semester not found', 404));
  }
  
  // Validate dates
  if (new Date(startDate) >= new Date(endDate)) {
    return next(new AppError('Start date must be before end date', 400));
  }
  
  // Create term
  const term = await AcademicTerm.create({
    name,
    semester,
    startDate,
    endDate,
    isActive: isActive !== undefined ? isActive : true
  });
  
  // Populate for response
  await term.populate('semester', 'name');
  
  res.status(201).json({
    status: 'success',
    data: {
      term
    }
  });
});

/**
 * Get academic terms
 * @route GET /api/academic/terms
 * @access Admin, Faculty, Student
 */
exports.getAcademicTerms = catchAsync(async (req, res, next) => {
  const { semester, isActive } = req.query;
  
  // Build query
  const query = {};
  if (semester) query.semester = semester;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  
  const terms = await AcademicTerm.find(query)
    .populate('semester', 'name')
    .sort({ startDate: 1 });
  
  res.status(200).json({
    status: 'success',
    results: terms.length,
    data: {
      terms
    }
  });
});