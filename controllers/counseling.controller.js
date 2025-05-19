// controllers/counseling.controller.js
const mongoose = require('mongoose');
const CounselingAppointment = require('../models/CounselingAppointment');
const Counselor = require('../models/Counselor');
const CounselingService = require('../models/CounselingService');
const Student = require('../models/Student');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * Get all counselors
 * @route GET /api/counseling/counselors
 * @access Admin, Student
 */
exports.getAllCounselors = catchAsync(async (req, res, next) => {
  const counselors = await Counselor.find({ status: 'active' })
    .populate('user', 'username email')
    .sort({ name: 1 });
  
  res.status(200).json({
    status: 'success',
    results: counselors.length,
    data: {
      counselors
    }
  });
});

/**
 * Get all counseling services
 * @route GET /api/counseling/services
 * @access Admin, Student
 */
exports.getAllServices = catchAsync(async (req, res, next) => {
  const services = await CounselingService.find({ isActive: true })
    .sort({ name: 1 });
  
  res.status(200).json({
    status: 'success',
    results: services.length,
    data: {
      services
    }
  });
});

/**
 * Create new counselor
 * @route POST /api/counseling/counselors
 * @access Admin
 */
exports.createCounselor = catchAsync(async (req, res, next) => {
  const { name, specialization, qualification, contactNo, email, availableDays, availableHours } = req.body;
  
  // Check if user exists
  let user;
  if (req.body.userId) {
    user = await User.findById(req.body.userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }
  } else {
    // Create new user for counselor
    const password = generateRandomPassword();
    user = await User.create({
      username: email,
      email,
      password,
      isActive: true
    });
    
    // Assign counselor role
    const counselorRole = await Role.findOne({ name: 'Staff' });
    if (counselorRole) {
      user.roles = [counselorRole._id];
      await user.save();
    }
    
    // Send welcome email
    await emailService.sendWelcomeEmail({
      email: user.email,
      name
    }, password);
  }
  
  // Create counselor
  const counselor = await Counselor.create({
    user: user._id,
    name,
    specialization,
    qualification,
    contactNo,
    email,
    availableDays,
    availableHours,
    status: 'active'
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      counselor
    }
  });
});

/**
 * Create new counseling service
 * @route POST /api/counseling/services
 * @access Admin
 */
exports.createService = catchAsync(async (req, res, next) => {
  const { name, serviceType, description, isActive } = req.body;
  
  const service = await CounselingService.create({
    name,
    serviceType,
    description,
    isActive: isActive !== undefined ? isActive : true
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      service
    }
  });
});

/**
 * Schedule appointment
 * @route POST /api/counseling/appointments
 * @access Student, Admin
 */
exports.scheduleAppointment = catchAsync(async (req, res, next) => {
  const { studentId, counselorId, serviceId, appointmentDate, appointmentTime, reason } = req.body;
  
  // Validate student
  const student = await Student.findById(studentId);
  if (!student) {
    return next(new AppError('Student not found', 404));
  }
  
  // Validate counselor
  const counselor = await Counselor.findById(counselorId);
  if (!counselor) {
    return next(new AppError('Counselor not found', 404));
  }
  
  // Validate service
  const service = await CounselingService.findById(serviceId);
  if (!service) {
    return next(new AppError('Service not found', 404));
  }
  
  // Check for conflicting appointments
  const existingAppointment = await CounselingAppointment.findOne({
    counselor: counselorId,
    appointmentDate,
    appointmentTime,
    status: { $in: ['scheduled', 'completed'] }
  });
  
  if (existingAppointment) {
    return next(new AppError('Counselor already has an appointment at this time', 400));
  }
  
  // Create appointment
  const appointment = await CounselingAppointment.create({
    student: studentId,
    counselor: counselorId,
    service: serviceId,
    appointmentDate,
    appointmentTime,
    reason,
    status: 'scheduled'
  });
  
  // Notify student and counselor
  await notificationService.createNotification({
    userId: student.user,
    title: 'Counseling Appointment Scheduled',
    message: `Your appointment with ${counselor.name} has been scheduled for ${new Date(appointmentDate).toLocaleDateString()} at ${appointmentTime}.`,
    type: 'appointment',
    relatedEntity: 'counseling',
    relatedId: appointment._id,
    sendEmail: true
  });
  
  await notificationService.createNotification({
    userId: counselor.user,
    title: 'New Counseling Appointment',
    message: `You have a new appointment with ${student.name} scheduled for ${new Date(appointmentDate).toLocaleDateString()} at ${appointmentTime}.`,
    type: 'appointment',
    relatedEntity: 'counseling',
    relatedId: appointment._id,
    sendEmail: true
  });
  
  // Populate data for response
  await appointment
    .populate('student', 'name')
    .populate('counselor', 'name')
    .populate('service', 'name');
  
  res.status(201).json({
    status: 'success',
    data: {
      appointment
    }
  });
});

/**
 * Get student appointments
 * @route GET /api/counseling/appointments/student/:studentId
 * @access Student, Admin
 */
exports.getStudentAppointments = catchAsync(async (req, res, next) => {
  const { studentId } = req.params;
  const { status } = req.query;
  
  // Build query
  const query = { student: studentId };
  if (status) {
    query.status = status;
  }
  
  // Execute query
  const appointments = await CounselingAppointment.find(query)
    .populate('counselor', 'name specialization')
    .populate('service', 'name')
    .sort({ appointmentDate: -1, appointmentTime: -1 });
  
  res.status(200).json({
    status: 'success',
    results: appointments.length,
    data: {
      appointments
    }
  });
});

/**
 * Get counselor appointments
 * @route GET /api/counseling/appointments/counselor/:counselorId
 * @access Counselor, Admin
 */
exports.getCounselorAppointments = catchAsync(async (req, res, next) => {
  const { counselorId } = req.params;
  const { status, date } = req.query;
  
  // Build query
  const query = { counselor: counselorId };
  if (status) {
    query.status = status;
  }
  
  if (date) {
    // Filter by specific date
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    
    query.appointmentDate = {
      $gte: startDate,
      $lt: endDate
    };
  }
  
  // Execute query
  const appointments = await CounselingAppointment.find(query)
    .populate('student', 'name')
    .populate('service', 'name')
    .sort({ appointmentDate: 1, appointmentTime: 1 });
  
  res.status(200).json({
    status: 'success',
    results: appointments.length,
    data: {
      appointments
    }
  });
});

/**
 * Update appointment status
 * @route PATCH /api/counseling/appointments/:id/status
 * @access Counselor, Admin
 */
exports.updateAppointmentStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status, remarks, followUpRequired, followUpDate } = req.body;
  
  // Validate status
  if (!['scheduled', 'completed', 'cancelled', 'no_show'].includes(status)) {
    return next(new AppError('Invalid status value', 400));
  }
  
  // Find appointment
  const appointment = await CounselingAppointment.findById(id);
  
  if (!appointment) {
    return next(new AppError('Appointment not found', 404));
  }
  
  // Update appointment
  appointment.status = status;
  if (remarks) appointment.remarks = remarks;
  
  if (followUpRequired !== undefined) {
    appointment.followUpRequired = followUpRequired;
    if (followUpRequired && followUpDate) {
      appointment.followUpDate = followUpDate;
    }
  }
  
  await appointment.save();
  
  // Notify student
  const student = await Student.findById(appointment.student).populate('user');
  
  if (student && student.user) {
    await notificationService.createNotification({
      userId: student.user._id,
      title: 'Counseling Appointment Update',
      message: `Your appointment status has been updated to "${status}"${remarks ? `: ${remarks}` : ''}`,
      type: 'appointment_update',
      relatedEntity: 'counseling',
      relatedId: appointment._id,
      sendEmail: true
    });
  }
  
  // Populate data for response
  await appointment
    .populate('student', 'name')
    .populate('counselor', 'name')
    .populate('service', 'name');
  
  res.status(200).json({
    status: 'success',
    data: {
      appointment
    }
  });
});