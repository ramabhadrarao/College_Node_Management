// controllers/faculty.controller.js (complete implementation)
const mongoose = require('mongoose');
const Faculty = require('../models/Faculty');
const User = require('../models/User');
const Role = require('../models/Role');
const Department = require('../models/Department');
const FacultyQualification = require('../models/FacultyQualification');
const WorkExperience = require('../models/WorkExperience');
const ResearchPublication = require('../models/ResearchPublication');
const WorkshopSeminar = require('../models/WorkshopSeminar');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const fileService = require('../services/fileService');
const emailService = require('../services/emailService');
const { generateRandomPassword } = require('../utils/helpers');

/**
 * Register a new faculty member
 * @route POST /api/faculty/register
 * @access Public
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
      username: req.body.email,
      email: req.body.email,
      password,
      isActive: false, // Faculty needs approval
      isVerified: false
    }], { session });

    // 5) Assign faculty role
    const facultyRole = await Role.findOne({ name: 'Faculty' });
    if (facultyRole) {
      user[0].roles = [facultyRole._id];
      await user[0].save({ session });
    }

    // 6) Handle file uploads if any
    let photoAttachment = null;
    let aadharAttachment = null;
    let panAttachment = null;

    if (req.files) {
      if (req.files.photo) {
        photoAttachment = await fileService.uploadFile(req.files.photo, 'faculty/photo');
      }
      if (req.files.aadhar) {
        aadharAttachment = await fileService.uploadFile(req.files.aadhar, 'faculty/documents');
      }
      if (req.files.pan) {
        panAttachment = await fileService.uploadFile(req.files.pan, 'faculty/documents');
      }
    }

    // 7) Create faculty profile
    const faculty = await Faculty.create([{
      user: user[0]._id,
      regdno: req.body.regdno,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      gender: req.body.gender,
      dob: req.body.dob,
      contactNo: req.body.contactNo,
      email: req.body.email,
      department: req.body.department,
      designation: req.body.designation,
      qualification: req.body.qualification,
      specialization: req.body.specialization,
      joinDate: req.body.joinDate,
      address: req.body.address,
      bloodGroup: req.body.bloodGroup,
      photoAttachment,
      aadharAttachment,
      panAttachment,
      status: 'pending', // Initial status is pending approval
      additionalDetails: {
        fatherName: req.body.fatherName,
        fatherOccupation: req.body.fatherOccupation,
        motherName: req.body.motherName,
        motherOccupation: req.body.motherOccupation,
        maritalStatus: req.body.maritalStatus,
        spouseName: req.body.spouseName,
        spouseOccupation: req.body.spouseOccupation,
        nationality: req.body.nationality,
        religion: req.body.religion,
        caste: req.body.caste,
        subCaste: req.body.subCaste,
        aadharNo: req.body.aadharNo,
        panNo: req.body.panNo,
        contactNo2: req.body.contactNo2,
        permanentAddress: req.body.permanentAddress,
        correspondenceAddress: req.body.correspondenceAddress,
        scopusAuthorId: req.body.scopusAuthorId,
        orcidId: req.body.orcidId,
        googleScholarIdLink: req.body.googleScholarIdLink,
        aicteId: req.body.aicteId
      }
    }], { session });

    // Add faculty_id to user attributes for ABAC
    user[0].attributes.push({
      name: 'faculty_id',
      value: faculty[0]._id.toString()
    });
    await user[0].save({ session });

    // 8) Commit transaction
    await session.commitTransaction();
    session.endSession();

    // 9) Send welcome email with credentials
    await emailService.sendWelcomeEmail({
      email: user[0].email,
      name: `${faculty[0].firstName} ${faculty[0].lastName}`
    }, password);

    // 10) Send response
    res.status(201).json({
      status: 'success',
      message: 'Faculty registration successful! Please check your email for login credentials.',
      data: {
        faculty: {
          id: faculty[0]._id,
          name: `${faculty[0].firstName} ${faculty[0].lastName}`,
          email: faculty[0].email,
          status: faculty[0].status
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
 * Get all faculty members
 * @route GET /api/faculty
 * @access Admin, HOD
 */
exports.getAllFaculty = catchAsync(async (req, res, next) => {
  // Build query
  const query = {};
  
  // Filter by department if specified
  if (req.query.department) {
    query.department = req.query.department;
  }
  
  // Filter by status if specified
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  
  // Execute query with pagination
  const faculty = await Faculty.find(query)
    .populate('department', 'name code')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  // Get total count for pagination
  const total = await Faculty.countDocuments(query);
  
  res.status(200).json({
    status: 'success',
    results: faculty.length,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    },
    data: {
      faculty
    }
  });
});

/**
 * Get faculty profile by ID
 * @route GET /api/faculty/:id
 * @access Admin, Faculty Owner, HOD
 */
exports.getFacultyById = catchAsync(async (req, res, next) => {
  const faculty = await Faculty.findById(req.params.id)
    .populate('department', 'name code');
  
  if (!faculty) {
    return next(new AppError('Faculty not found', 404));
  }
  
  // Check if current user is the owner of the profile
  const isOwner = req.user.id === faculty.user.toString();
  
  // Check if current user is HOD of faculty's department
  const isHOD = false; // This would be implemented with proper department checks
  
  // If not admin, owner, or HOD, check visibility settings
  if (!req.user.roles.includes('Admin') && !isOwner && !isHOD) {
    // Filter out hidden fields based on visibility settings
    // This is a simplified implementation
    if (faculty.visibility === 'hide') {
      return next(new AppError('You do not have permission to view this profile', 403));
    }
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      faculty
    }
  });
});

/**
 * Update faculty profile
 * @route PATCH /api/faculty/:id
 * @access Admin, Faculty Owner
 */
exports.updateFaculty = catchAsync(async (req, res, next) => {
  const faculty = await Faculty.findById(req.params.id);
  
  if (!faculty) {
    return next(new AppError('Faculty not found', 404));
  }
  
  // Check if current user is the owner of the profile
  const isOwner = req.user.id === faculty.user.toString();
  const isAdmin = req.user.roles.includes('Admin');
  
  // Only owner or admin can update
  if (!isAdmin && !isOwner) {
    return next(new AppError('You do not have permission to update this profile', 403));
  }
  
  // If faculty profile is frozen and user is not admin, prevent updates
  if (faculty.editEnabled === false && !isAdmin) {
    return next(new AppError('Profile is currently frozen and cannot be edited', 403));
  }
  
  // Handle file uploads if any
  if (req.files) {
    if (req.files.photo) {
      // Delete old photo if exists
      if (faculty.photoAttachment) {
        await fileService.deleteFile(faculty.photoAttachment);
      }
      faculty.photoAttachment = await fileService.uploadFile(req.files.photo, 'faculty/photo');
    }
    
    if (req.files.aadhar) {
      if (faculty.aadharAttachment) {
        await fileService.deleteFile(faculty.aadharAttachment);
      }
      faculty.aadharAttachment = await fileService.uploadFile(req.files.aadhar, 'faculty/documents');
    }
    
    if (req.files.pan) {
      if (faculty.panAttachment) {
        await fileService.deleteFile(faculty.panAttachment);
      }
      faculty.panAttachment = await fileService.uploadFile(req.files.pan, 'faculty/documents');
    }
  }
  
  // Update basic info
  const fieldsToUpdate = [
    'firstName', 'lastName', 'contactNo', 'department', 'designation', 
    'qualification', 'specialization', 'address', 'bloodGroup'
  ];
  
  fieldsToUpdate.forEach(field => {
    if (req.body[field] !== undefined) {
      faculty[field] = req.body[field];
    }
  });
  
  // Update additional details if provided
  if (req.body.additionalDetails) {
    Object.keys(req.body.additionalDetails).forEach(key => {
      faculty.additionalDetails[key] = req.body.additionalDetails[key];
    });
  }
  
  // Save changes
  await faculty.save();
  
  res.status(200).json({
    status: 'success',
    message: 'Faculty profile updated successfully',
    data: {
      faculty
    }
  });
});

/**
 * Change faculty status (approve/reject/freeze)
 * @route PATCH /api/faculty/:id/status
 * @access Admin, HOD
 */
exports.changeFacultyStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  
  if (!['active', 'inactive', 'pending', 'rejected'].includes(status)) {
    return next(new AppError('Invalid status value', 400));
  }
  
  const faculty = await Faculty.findById(req.params.id);
  
  if (!faculty) {
    return next(new AppError('Faculty not found', 404));
  }
  
  // Update faculty status
  faculty.status = status;
  
  // If approving, activate user account
  if (status === 'active') {
    await User.findByIdAndUpdate(faculty.user, { isActive: true });
  }
  
  // If rejecting, deactivate user account
  if (status === 'inactive' || status === 'rejected') {
    await User.findByIdAndUpdate(faculty.user, { isActive: false });
  }
  
  await faculty.save();
  
  // Send email notification about status change
  const user = await User.findById(faculty.user);
  
  await emailService.sendNotificationEmail({
    user: {
      email: user.email,
      name: `${faculty.firstName} ${faculty.lastName}`
    },
    subject: `Faculty Profile Status Update: ${status.toUpperCase()}`,
    message: `Your faculty profile status has been changed to ${status.toUpperCase()}.`,
    template: 'status-update',
    data: {
      status: status.toUpperCase(),
      reason: req.body.reason || 'No reason provided'
    }
  });
  
  res.status(200).json({
    status: 'success',
    message: `Faculty status changed to ${status} successfully`,
    data: {
      faculty: {
        id: faculty._id,
        status: faculty.status
      }
    }
  });
});

/**
 * Toggle faculty profile edit status (freeze/unfreeze)
 * @route PATCH /api/faculty/:id/toggle-edit
 * @access Admin, HOD
 */
exports.toggleEditStatus = catchAsync(async (req, res, next) => {
  const faculty = await Faculty.findById(req.params.id);
  
  if (!faculty) {
    return next(new AppError('Faculty not found', 404));
  }
  
  // Toggle edit status
  faculty.editEnabled = !faculty.editEnabled;
  await faculty.save();
  
  res.status(200).json({
    status: 'success',
    message: `Faculty profile ${faculty.editEnabled ? 'unlocked' : 'frozen'} successfully`,
    data: {
      faculty: {
        id: faculty._id,
        editEnabled: faculty.editEnabled
      }
    }
  });
});

/**
 * Add faculty academic information (publications, experience, etc.)
 * @route POST /api/faculty/:id/academics
 * @access Faculty Owner, Admin
 */
exports.addAcademicInfo = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { infoType } = req.body;
  
  // Validate faculty exists
  const faculty = await Faculty.findById(id);
  if (!faculty) {
    return next(new AppError('Faculty not found', 404));
  }
  
  // Check permissions
  const isOwner = req.user.id === faculty.user.toString();
  const isAdmin = req.user.roles.includes('Admin');
  
  if (!isOwner && !isAdmin) {
    return next(new AppError('Not authorized to update this faculty profile', 403));
  }
  
  // Check if profile is frozen
  if (!faculty.editEnabled && !isAdmin) {
    return next(new AppError('Faculty profile is frozen and cannot be edited', 403));
  }
  
  let result;
  
  // Handle file uploads if any
  let attachment = null;
  if (req.files && req.files.attachment) {
    attachment = await fileService.uploadFile(req.files.attachment, `faculty/${infoType}`);
  }
  
  // Create different types of academic information
  switch (infoType) {
    case 'qualification':
      result = await FacultyQualification.create({
        faculty: id,
        degree: req.body.degree,
        specialization: req.body.specialization,
        institution: req.body.institution,
        boardUniversity: req.body.boardUniversity,
        passingYear: req.body.passingYear,
        percentageCgpa: req.body.percentageCgpa,
        certificateAttachment: attachment,
        visibility: req.body.visibility || 'show'
      });
      break;
      
    case 'experience':
      result = await WorkExperience.create({
        faculty: id,
        institutionName: req.body.institutionName,
        experienceType: req.body.experienceType,
        designation: req.body.designation,
        fromDate: req.body.fromDate,
        toDate: req.body.toDate,
        numberOfYears: req.body.numberOfYears,
        responsibilities: req.body.responsibilities,
        serviceCertificateAttachment: attachment,
        visibility: req.body.visibility || 'show'
      });
      break;
      
    case 'publication':
      result = await ResearchPublication.create({
        faculty: id,
        title: req.body.title,
        journalName: req.body.journalName,
        type: req.body.type,
        publicationDate: req.body.publicationDate,
        doi: req.body.doi,
        description: req.body.description,
        attachment: attachment,
        visibility: req.body.visibility || 'show',
        citations: req.body.citations,
        impactFactor: req.body.impactFactor
      });
      break;
      
    case 'workshop':
      result = await WorkshopSeminar.create({
        faculty: id,
        title: req.body.title,
        type: req.body.type,
        location: req.body.location,
        organizedBy: req.body.organizedBy,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        description: req.body.description,
        attachment: attachment,
        visibility: req.body.visibility || 'show'
      });
      break;
      
    default:
      return next(new AppError(`Invalid info type: ${infoType}`, 400));
  }
  
  res.status(201).json({
    status: 'success',
    message: `Faculty ${infoType} information added successfully`,
    data: {
      [infoType]: result
    }
  });
});

/**
 * Get faculty academic information
 * @route GET /api/faculty/:id/academics/:infoType
 * @access Faculty Owner, Admin, Public (with visibility)
 */
exports.getAcademicInfo = catchAsync(async (req, res, next) => {
  const { id, infoType } = req.params;
  
  // Validate faculty exists
  const faculty = await Faculty.findById(id);
  if (!faculty) {
    return next(new AppError('Faculty not found', 404));
  }
  
  // Check permissions
  const isOwner = req.user && req.user.id === faculty.user.toString();
  const isAdmin = req.user && req.user.roles.includes('Admin');
  
  // Handle different types of academic information
  let Model;
  switch (infoType) {
    case 'qualifications':
      Model = FacultyQualification;
      break;
      
    case 'experiences':
      Model = WorkExperience;
      break;
      
    case 'publications':
      Model = ResearchPublication;
      break;
      
    case 'workshops':
      Model = WorkshopSeminar;
      break;
      
    default:
      return next(new AppError(`Invalid info type: ${infoType}`, 400));
  }
  
  // Build query - if not owner or admin, only show visible items
  const query = { faculty: id };
  if (!isOwner && !isAdmin) {
    query.visibility = 'show';
  }
  
  const results = await Model.find(query).sort({ createdAt: -1 });
  
  res.status(200).json({
    status: 'success',
    results: results.length,
    data: {
      [infoType]: results
    }
  });
});

/**
 * Generate faculty statistics
 * @route GET /api/faculty/stats
 * @access Admin, HOD
 */
exports.getFacultyStats = catchAsync(async (req, res, next) => {
  // Total faculty count
  const totalFaculty = await Faculty.countDocuments();
  
  // Department-wise faculty count
  const departmentStats = await Faculty.aggregate([
    {
      $group: {
        _id: '$department',
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'departments',
        localField: '_id',
        foreignField: '_id',
        as: 'departmentInfo'
      }
    },
    {
      $unwind: '$departmentInfo'
    },
    {
      $project: {
        departmentName: '$departmentInfo.name',
        departmentCode: '$departmentInfo.code',
        count: 1
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
  
  // Status-wise faculty count
  const statusStats = await Faculty.aggregate([
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
  
  // Joining date statistics by year
  const joiningStats = await Faculty.aggregate([
    {
      $group: {
        _id: { $year: '$joinDate' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        year: '$_id',
        count: 1,
        _id: 0
      }
    },
    {
      $sort: { year: 1 }
    }
  ]);
  
  // Designation-wise faculty count
  const designationStats = await Faculty.aggregate([
    {
      $group: {
        _id: '$designation',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        designation: '$_id',
        count: 1,
        _id: 0
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
  
  // Qualification-wise faculty count
  const qualificationStats = await Faculty.aggregate([
    {
      $group: {
        _id: '$qualification',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        qualification: '$_id',
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
      totalFaculty,
      departmentStats,
      statusStats,
      joiningStats,
      designationStats,
      qualificationStats
    }
  });
});

/**
 * Search faculty by name, designation, or specialization
 * @route GET /api/faculty/search
 * @access Admin, HOD, Faculty
 */
exports.searchFaculty = catchAsync(async (req, res, next) => {
  const { query } = req.query;
  
  if (!query) {
    return next(new AppError('Search query is required', 400));
  }
  
  const faculty = await Faculty.find({
    $or: [
      { firstName: { $regex: query, $options: 'i' } },
      { lastName: { $regex: query, $options: 'i' } },
      { designation: { $regex: query, $options: 'i' } },
      { specialization: { $regex: query, $options: 'i' } },
      { qualification: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } }
    ]
  })
    .limit(20)
    .select('firstName lastName email designation department photoAttachment')
    .populate('department', 'name code');
  
  res.status(200).json({
    status: 'success',
    results: faculty.length,
    data: {
      faculty
    }
  });
});

/**
 * Get faculty by department
 * @route GET /api/faculty/department/:departmentId
 * @access Admin, HOD, Faculty
 */
exports.getFacultyByDepartment = catchAsync(async (req, res, next) => {
  const { departmentId } = req.params;
  
  // Validate department exists
  const department = await Department.findById(departmentId);
  if (!department) {
    return next(new AppError('Department not found', 404));
  }
  
  // Get faculty members
  const faculty = await Faculty.find({
    department: departmentId,
    status: 'active'
  })
    .sort({ designation: 1, firstName: 1 })
    .select('firstName lastName email designation photoAttachment');
  
  res.status(200).json({
    status: 'success',
    results: faculty.length,
    data: {
      department: {
        id: department._id,
        name: department.name,
        code: department.code
      },
      faculty
    }
  });
});

/**
 * Delete faculty academic information
 * @route DELETE /api/faculty/:id/academics/:infoType/:infoId
 * @access Faculty Owner, Admin
 */
exports.deleteAcademicInfo = catchAsync(async (req, res, next) => {
  const { id, infoType, infoId } = req.params;
  
  // Validate faculty exists
  const faculty = await Faculty.findById(id);
  if (!faculty) {
    return next(new AppError('Faculty not found', 404));
  }
  
  // Check permissions
  const isOwner = req.user.id === faculty.user.toString();
  const isAdmin = req.user.roles.includes('Admin');
  
  if (!isOwner && !isAdmin) {
    return next(new AppError('Not authorized to update this faculty profile', 403));
  }
  
  // Check if profile is frozen
  if (!faculty.editEnabled && !isAdmin) {
    return next(new AppError('Faculty profile is frozen and cannot be edited', 403));
  }
  
  // Handle different types of academic information
  let Model;
  switch (infoType) {
    case 'qualification':
      Model = FacultyQualification;
      break;
      
    case 'experience':
      Model = WorkExperience;
      break;
      
    case 'publication':
      Model = ResearchPublication;
      break;
      
    case 'workshop':
      Model = WorkshopSeminar;
      break;
      
    default:
      return next(new AppError(`Invalid info type: ${infoType}`, 400));
  }
  
  // Find and delete the item
  const item = await Model.findOneAndDelete({
    _id: infoId,
    faculty: id
  });
  
  if (!item) {
    return next(new AppError(`No ${infoType} found with that ID`, 404));
  }
  
  // Delete attachment if exists
  if (item.attachment || item.certificateAttachment || item.serviceCertificateAttachment) {
    const attachmentPath = item.attachment || item.certificateAttachment || item.serviceCertificateAttachment;
    await fileService.deleteFile(attachmentPath);
  }
  
  res.status(200).json({
    status: 'success',
    message: `Faculty ${infoType} information deleted successfully`
  });
});

/**
 * Update faculty academic information
 * @route PATCH /api/faculty/:id/academics/:infoType/:infoId
 * @access Faculty Owner, Admin
 */
exports.updateAcademicInfo = catchAsync(async (req, res, next) => {
  const { id, infoType, infoId } = req.params;
  
  // Validate faculty exists
  const faculty = await Faculty.findById(id);
  if (!faculty) {
    return next(new AppError('Faculty not found', 404));
  }
  
  // Check permissions
  const isOwner = req.user.id === faculty.user.toString();
  const isAdmin = req.user.roles.includes('Admin');
  
  if (!isOwner && !isAdmin) {
    return next(new AppError('Not authorized to update this faculty profile', 403));
  }
  
  // Check if profile is frozen
  if (!faculty.editEnabled && !isAdmin) {
    return next(new AppError('Faculty profile is frozen and cannot be edited', 403));
  }
  
  // Handle different types of academic information
  let Model;
  let allowedFields;
  switch (infoType) {
    case 'qualification':
      Model = FacultyQualification;
      allowedFields = ['degree', 'specialization', 'institution', 'boardUniversity', 'passingYear', 'percentageCgpa', 'visibility'];
      break;
      
    case 'experience':
      Model = WorkExperience;
      allowedFields = ['institutionName', 'experienceType', 'designation', 'fromDate', 'toDate', 'numberOfYears', 'responsibilities', 'visibility'];
      break;
      
    case 'publication':
      Model = ResearchPublication;
      allowedFields = ['title', 'journalName', 'type', 'publicationDate', 'doi', 'description', 'visibility', 'citations', 'impactFactor'];
      break;
      
    case 'workshop':
      Model = WorkshopSeminar;
      allowedFields = ['title', 'type', 'location', 'organizedBy', 'startDate', 'endDate', 'description', 'visibility'];
      break;
      
    default:
      return next(new AppError(`Invalid info type: ${infoType}`, 400));
  }
  
  // Find the item
  const item = await Model.findOne({
    _id: infoId,
    faculty: id
  });
  
  if (!item) {
    return next(new AppError(`No ${infoType} found with that ID`, 404));
  }
  
  // Handle file upload if any
  if (req.files && req.files.attachment) {
    // Delete old attachment if exists
    if (item.attachment || item.certificateAttachment || item.serviceCertificateAttachment) {
      const attachmentPath = item.attachment || item.certificateAttachment || item.serviceCertificateAttachment;
      await fileService.deleteFile(attachmentPath);
    }
    
    // Upload new attachment
    const newAttachment = await fileService.uploadFile(req.files.attachment, `faculty/${infoType}`);
    
    // Update attachment field based on model type
    if (infoType === 'qualification') {
      item.certificateAttachment = newAttachment;
    } else if (infoType === 'experience') {
      item.serviceCertificateAttachment = newAttachment;
    } else {
      item.attachment = newAttachment;
    }
  }
  
  // Update fields
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      item[field] = req.body[field];
    }
  });
  
  // Save changes
  await item.save();
  
  res.status(200).json({
    status: 'success',
    message: `Faculty ${infoType} information updated successfully`,
    data: {
      [infoType]: item
    }
  });
});

module.exports = exports;