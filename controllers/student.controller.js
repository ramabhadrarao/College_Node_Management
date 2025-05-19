// controllers/student.controller.js
const mongoose = require('mongoose');
const Student = require('../models/Student');
const User = require('../models/User');
const Role = require('../models/Role');
const Batch = require('../models/Batch');
const Program = require('../models/Program');
const Branch = require('../models/Branch');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const fileService = require('../services/fileService');
const emailService = require('../services/emailService');
const { generateRandomPassword } = require('../utils/helpers');

/**
 * Register a new student
 * @route POST /api/students/register
 * @access Admin
 */
exports.register = catchAsync(async (req, res, next) => {
  // 1) Check if email already exists
  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    return next(new AppError('Email already in use', 400));
  }

  // 2) Start a transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 3) Generate a random password
    const password = generateRandomPassword();

    // 4) Create user account
    const user = await User.create([{
      username: req.body.admissionNo, // Using admission number as username
      email: req.body.email,
      password,
      isActive: true,
      isVerified: false
    }], { session });

    // 5) Assign student role
    const studentRole = await Role.findOne({ name: 'Student' });
    if (studentRole) {
      user[0].roles = [studentRole._id];
      await user[0].save({ session });
    }

    // 6) Validate batch, program, and branch
    const batch = await Batch.findById(req.body.batch);
    if (!batch) {
      throw new AppError('Invalid batch', 400);
    }

    const program = await Program.findById(req.body.program);
    if (!program) {
      throw new AppError('Invalid program', 400);
    }

    const branch = await Branch.findById(req.body.branch);
    if (!branch) {
      throw new AppError('Invalid branch', 400);
    }

    // 7) Handle file uploads if any
    let photoAttachment = null;
    let aadharAttachment = null;
    let fatherAadharAttachment = null;
    let motherAadharAttachment = null;

    if (req.files) {
      if (req.files.photo) {
        photoAttachment = await fileService.uploadFile(req.files.photo, 'students/photo');
      }
      if (req.files.aadhar) {
        aadharAttachment = await fileService.uploadFile(req.files.aadhar, 'students/documents');
      }
      if (req.files.fatherAadhar) {
        fatherAadharAttachment = await fileService.uploadFile(req.files.fatherAadhar, 'students/documents');
      }
      if (req.files.motherAadhar) {
        motherAadharAttachment = await fileService.uploadFile(req.files.motherAadhar, 'students/documents');
      }
    }

    // 8) Create student profile
    const student = await Student.create([{
      user: user[0]._id,
      admissionNo: req.body.admissionNo,
      regdNo: req.body.regdNo,
      name: req.body.name,
      gender: req.body.gender,
      dob: req.body.dob,
      email: req.body.email,
      mobile: req.body.mobile,
      batch: req.body.batch,
      program: req.body.program,
      branch: req.body.branch,
      regulation: req.body.regulation,
      currentSemester: req.body.currentSemester,
      fatherName: req.body.fatherName,
      motherName: req.body.motherName,
      fatherMobile: req.body.fatherMobile,
      motherMobile: req.body.motherMobile,
      address: req.body.address,
      permanentAddress: req.body.permanentAddress,
      nationality: req.body.nationality,
      religion: req.body.religion,
      studentType: req.body.studentType,
      caste: req.body.caste,
      subCaste: req.body.subCaste,
      bloodGroup: req.body.bloodGroup,
      photoAttachment,
      aadharAttachment,
      fatherAadharAttachment,
      motherAadharAttachment,
      status: 'active'
    }], { session });

    // Add student_id to user attributes for ABAC
    user[0].attributes.push({
      name: 'student_id',
      value: student[0]._id.toString()
    });
    await user[0].save({ session });

    // 9) Add educational details if provided
    if (req.body.educationalDetails && Array.isArray(req.body.educationalDetails)) {
      for (const edu of req.body.educationalDetails) {
        await StudentEducationalDetail.create([{
          student: student[0]._id,
          eduCourseName: edu.courseName,
          yearOfPassing: edu.yearOfPassing,
          classDivision: edu.classDivision,
          percentageGrade: edu.percentageGrade,
          boardUniversity: edu.boardUniversity,
          district: edu.district,
          state: edu.state,
          subjectsOffered: edu.subjectsOffered,
          certificateAttachment: edu.certificateAttachment
        }], { session });
      }
    }

    // 10) Commit transaction
    await session.commitTransaction();
    session.endSession();

    // 11) Send welcome email with credentials
    await emailService.sendWelcomeEmail({
      email: user[0].email,
      name: student[0].name
    }, password);

    // 12) Send response
    res.status(201).json({
      status: 'success',
      message: 'Student registration successful! Login credentials sent to email.',
      data: {
        student: {
          id: student[0]._id,
          name: student[0].name,
          admissionNo: student[0].admissionNo,
          email: student[0].email,
          status: student[0].status
        }
      }
    });
  } catch (error) {
    // If anything fails, abort the transaction and rollback all changes
    await session.abortTransaction();
    session.endSession();

    return next(error);
  }
});

/**
 * Bulk register students from CSV/Excel
 * @route POST /api/students/register-bulk
 * @access Admin
 */
exports.registerBulk = catchAsync(async (req, res, next) => {
  if (!req.files || !req.files.file) {
    return next(new AppError('Please upload a file', 400));
  }

  // Process the uploaded file (CSV/Excel)
  const fileBuffer = req.files.file.data;
  const fileData = await fileService.processFile(fileBuffer, req.files.file.mimetype);

  if (!fileData || !fileData.length) {
    return next(new AppError('Invalid file or empty data', 400));
  }

  // Track success and failures
  const results = {
    success: [],
    failures: []
  };

  // Process each row in the file
  for (const row of fileData) {
    try {
      // Validate required fields
      if (!row.admissionNo || !row.name || !row.email || !row.batchId || 
          !row.programId || !row.branchId || !row.regulationId) {
        results.failures.push({
          row,
          error: 'Missing required fields'
        });
        continue;
      }

      // Check if email or admission number already exists
      const existingUser = await User.findOne({ email: row.email });
      const existingStudent = await Student.findOne({ admissionNo: row.admissionNo });

      if (existingUser || existingStudent) {
        results.failures.push({
          row,
          error: 'Email or admission number already exists'
        });
        continue;
      }

      // Generate random password
      const password = generateRandomPassword();

      // Create user
      const user = await User.create({
        username: row.admissionNo,
        email: row.email,
        password,
        isActive: true,
        isVerified: false
      });

      // Assign student role
      const studentRole = await Role.findOne({ name: 'Student' });
      if (studentRole) {
        user.roles = [studentRole._id];
        await user.save();
      }

      // Create student
      const student = await Student.create({
        user: user._id,
        admissionNo: row.admissionNo,
        regdNo: row.regdNo || null,
        name: row.name,
        gender: row.gender,
        dob: row.dob ? new Date(row.dob) : null,
        email: row.email,
        mobile: row.mobile,
        batch: row.batchId,
        program: row.programId,
        branch: row.branchId,
        regulation: row.regulationId,
        currentSemester: row.currentSemesterId,
        fatherName: row.fatherName,
        motherName: row.motherName,
        address: row.address,
        nationality: row.nationality,
        religion: row.religion,
        studentType: row.studentType || 'Day Scholar',
        status: 'active'
      });

      // Add student_id to user attributes
      user.attributes.push({
        name: 'student_id',
        value: student._id.toString()
      });
      await user.save();

      // Send welcome email
      await emailService.sendWelcomeEmail({
        email: user.email,
        name: student.name
      }, password);

      results.success.push({
        id: student._id,
        name: student.name,
        admissionNo: student.admissionNo,
        email: student.email
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
    message: `Processed ${fileData.length} students. Success: ${results.success.length}, Failures: ${results.failures.length}`,
    data: results
  });
});

/**
 * Get all students
 * @route GET /api/students
 * @access Admin, Faculty
 */
exports.getAllStudents = catchAsync(async (req, res, next) => {
  // Build filters
  const filter = {};
  
  if (req.query.batch) filter.batch = req.query.batch;
  if (req.query.program) filter.program = req.query.program;
  if (req.query.branch) filter.branch = req.query.branch;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.semester) filter.currentSemester = req.query.semester;
  
  // Search by name, admission number, or registration number
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { admissionNo: { $regex: req.query.search, $options: 'i' } },
      { regdNo: { $regex: req.query.search, $options: 'i' } }
    ];
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  
  // Execute query with pagination
  const students = await Student.find(filter)
    .populate('batch', 'name')
    .populate('program', 'name code')
    .populate('branch', 'name code')
    .populate('currentSemester', 'name')
    .sort({ admissionNo: 1 })
    .skip(skip)
    .limit(limit);
  
  // Get total count for pagination
  const total = await Student.countDocuments(filter);
  
  res.status(200).json({
    status: 'success',
    results: students.length,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    },
    data: {
      students
    }
  });
});

/**
 * Get student by ID
 * @route GET /api/students/:id
 * @access Admin, Faculty, Student (own profile)
 */
exports.getStudentById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const student = await Student.findById(id)
    .populate('batch', 'name')
    .populate('program', 'name code')
    .populate('branch', 'name code')
    .populate('currentSemester', 'name')
    .populate('regulation', 'name code');
  
  if (!student) {
    return next(new AppError('Student not found', 404));
  }
  
  // Check if current user is the owner of the profile
  const isOwner = req.user && student.user.toString() === req.user.id;
  
  // Check if current user is a faculty or admin
  const isFaculty = req.user && req.user.roles.some(role => 
    ['Admin', 'Faculty', 'HOD'].includes(role.name)
  );
  
  // Only allow access if user is admin, faculty, or the student themselves
  if (!isOwner && !isFaculty) {
    return next(new AppError('You are not authorized to access this information', 403));
  }
  
  // Get educational details
  const educationalDetails = await StudentEducationalDetail.find({ student: id });
  
  // For faculty, include additional info like attendance and academic performance
  let attendanceSummary;
  let academicResults;
  
  if (isFaculty) {
    // Get current semester attendance
    attendanceSummary = await AttendanceSummary.find({
      student: id,
      semester: student.currentSemester
    }).populate('course', 'name courseCode');
    
    // Get latest academic results
    academicResults = await StudentCourseResult.find({
      student: id,
      semester: student.currentSemester
    }).populate('course', 'name courseCode');
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      student,
      educationalDetails,
      ...(isFaculty && { 
        attendanceSummary,
        academicResults
      })
    }
  });
});

/**
 * Update student profile
 * @route PATCH /api/students/:id
 * @access Admin, Student (own profile)
 */
exports.updateStudent = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const student = await Student.findById(id);
  
  if (!student) {
    return next(new AppError('Student not found', 404));
  }
  
  // Check if current user is the owner of the profile
  const isOwner = req.user && student.user.toString() === req.user.id;
  const isAdmin = req.user && req.user.roles.includes('Admin');
  
  // Only allow update if user is admin or the student themselves
  if (!isOwner && !isAdmin) {
    return next(new AppError('You are not authorized to update this profile', 403));
  }
  
  // Fields that only admin can update
  const adminOnlyFields = ['admissionNo', 'regdNo', 'batch', 'program', 'branch', 
    'regulation', 'currentSemester', 'status'];
  
  // If user is not admin, remove admin-only fields from request
  if (!isAdmin) {
    adminOnlyFields.forEach(field => {
      if (req.body[field]) delete req.body[field];
    });
  }
  
  // Handle file uploads
  if (req.files) {
    if (req.files.photo) {
      // Delete old photo if exists
      if (student.photoAttachment) {
        await fileService.deleteFile(student.photoAttachment);
      }
      student.photoAttachment = await fileService.uploadFile(req.files.photo, 'students/photo');
    }
    
    if (req.files.aadhar) {
      if (student.aadharAttachment) {
        await fileService.deleteFile(student.aadharAttachment);
      }
      student.aadharAttachment = await fileService.uploadFile(req.files.aadhar, 'students/documents');
    }
  }
  
  // Update allowed fields
  const fieldsToUpdate = [
    'name', 'gender', 'dob', 'mobile', 'fatherName', 'motherName', 'fatherMobile', 
    'motherMobile', 'address', 'permanentAddress', 'nationality', 'religion', 
    'studentType', 'caste', 'subCaste', 'bloodGroup'
  ];
  
  // Add admin-only fields if user is admin
  if (isAdmin) {
    fieldsToUpdate.push(...adminOnlyFields);
  }
  
  // Update fields
  fieldsToUpdate.forEach(field => {
    if (req.body[field] !== undefined) {
      student[field] = req.body[field];
    }
  });
  
  await student.save();
  
  res.status(200).json({
    status: 'success',
    message: 'Student profile updated successfully',
    data: {
      student
    }
  });
});

/**
 * Change student status (active/inactive/graduated)
 * @route PATCH /api/students/:id/status
 * @access Admin
 */
exports.changeStudentStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['active', 'inactive', 'graduated', 'suspended', 'withdrawn'].includes(status)) {
    return next(new AppError('Invalid status value', 400));
  }
  
  const student = await Student.findById(id);
  
  if (!student) {
    return next(new AppError('Student not found', 404));
  }
  
  // Update student status
  student.status = status;
  
  // Update user account status based on student status
  const isActive = ['active', 'graduated'].includes(status);
  await User.findByIdAndUpdate(student.user, { isActive });
  
  await student.save();
  
  // Send notification email
  const user = await User.findById(student.user);
  
  await emailService.sendNotificationEmail({
    user: {
      email: user.email,
      name: student.name
    },
    subject: `Student Status Update: ${status.toUpperCase()}`,
    message: `Your student status has been changed to ${status.toUpperCase()}.`,
    data: {
      status: status.toUpperCase(),
      reason: req.body.reason || 'No reason provided'
    }
  });
  
  res.status(200).json({
    status: 'success',
    message: `Student status changed to ${status} successfully`,
    data: {
      student: {
        id: student._id,
        status: student.status
      }
    }
  });
});

/**
 * Get student statistics
 * @route GET /api/students/stats
 * @access Admin, Faculty
 */
exports.getStudentStats = catchAsync(async (req, res, next) => {
  // Total students count
  const totalStudents = await Student.countDocuments();
  
  // Count by status
  const statusStats = await Student.aggregate([
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
  
  // Count by batch
  const batchStats = await Student.aggregate([
    {
      $group: {
        _id: '$batch',
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'batches',
        localField: '_id',
        foreignField: '_id',
        as: 'batchInfo'
      }
    },
    {
      $unwind: '$batchInfo'
    },
    {
      $project: {
        batchName: '$batchInfo.name',
        startYear: '$batchInfo.startYear',
        endYear: '$batchInfo.endYear',
        count: 1,
        _id: 0
      }
    },
    {
      $sort: { startYear: -1 }
    }
  ]);
  
  // Count by program and branch
  const programBranchStats = await Student.aggregate([
    {
      $group: {
        _id: {
          program: '$program',
          branch: '$branch'
        },
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'programs',
        localField: '_id.program',
        foreignField: '_id',
        as: 'programInfo'
      }
    },
    {
      $lookup: {
        from: 'branches',
        localField: '_id.branch',
        foreignField: '_id',
        as: 'branchInfo'
      }
    },
    {
      $unwind: '$programInfo'
    },
    {
      $unwind: '$branchInfo'
    },
    {
      $project: {
        program: '$programInfo.name',
        programCode: '$programInfo.code',
        branch: '$branchInfo.name',
        branchCode: '$branchInfo.code',
        count: 1,
        _id: 0
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
  
  res.status(200).json({
    status: 'success',
    data: {
      totalStudents,
      statusStats,
      batchStats,
      programBranchStats
    }
  });
});

module.exports = exports;