// controllers/transport.controller.js
const mongoose = require('mongoose');
const TransportationRoute = require('../models/TransportationRoute');
const TransportVehicle = require('../models/TransportVehicle');
const TransportRegistration = require('../models/TransportRegistration');
const Student = require('../models/Student');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const fileService = require('../services/fileService');

/**
 * Get all transportation routes
 * @route GET /api/transport/routes
 * @access Admin, Student
 */
exports.getAllRoutes = catchAsync(async (req, res, next) => {
  const { status } = req.query;
  
  // Build query
  const query = {};
  if (status) {
    query.status = status;
  }
  
  const routes = await TransportationRoute.find(query)
    .sort({ name: 1 });
  
  res.status(200).json({
    status: 'success',
    results: routes.length,
    data: {
      routes
    }
  });
});

/**
 * Get route by ID
 * @route GET /api/transport/routes/:id
 * @access Admin, Student
 */
exports.getRouteById = catchAsync(async (req, res, next) => {
  const route = await TransportationRoute.findById(req.params.id);
  
  if (!route) {
    return next(new AppError('Route not found', 404));
  }
  
  // Get vehicles assigned to this route
  const vehicles = await TransportVehicle.find({ route: req.params.id });
  
  res.status(200).json({
    status: 'success',
    data: {
      route,
      vehicles
    }
  });
});

/**
 * Create new route
 * @route POST /api/transport/routes
 * @access Admin
 */
exports.createRoute = catchAsync(async (req, res, next) => {
  const {
    name,
    routeNumber,
    startLocation,
    endLocation,
    distance,
    stops,
    status
  } = req.body;
  
  // Handle route map upload
  let routeMapAttachment = null;
  if (req.file) {
    routeMapAttachment = await fileService.uploadFile(req.file, 'transport/routes');
  }
  
  // Parse stops if provided as string
  let parsedStops = stops;
  if (stops && typeof stops === 'string') {
    try {
      parsedStops = JSON.parse(stops);
    } catch (e) {
      parsedStops = [];
    }
  }
  
  // Create route
  const route = await TransportationRoute.create({
    name,
    routeNumber,
    startLocation,
    endLocation,
    distance: parseFloat(distance) || 0,
    routeMapAttachment,
    status: status || 'active',
    stops: parsedStops || []
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      route
    }
  });
});

/**
 * Update route
 * @route PATCH /api/transport/routes/:id
 * @access Admin
 */
exports.updateRoute = catchAsync(async (req, res, next) => {
  const {
    name,
    routeNumber,
    startLocation,
    endLocation,
    distance,
    stops,
    status
  } = req.body;
  
  // Find route
  const route = await TransportationRoute.findById(req.params.id);
  
  if (!route) {
    return next(new AppError('Route not found', 404));
  }
  
  // Handle route map upload
  if (req.file) {
    // Delete old map if exists
    if (route.routeMapAttachment) {
      await fileService.deleteFile(route.routeMapAttachment);
    }
    
    route.routeMapAttachment = await fileService.uploadFile(req.file, 'transport/routes');
  }
  
  // Update fields
  if (name) route.name = name;
  if (routeNumber) route.routeNumber = routeNumber;
  if (startLocation) route.startLocation = startLocation;
  if (endLocation) route.endLocation = endLocation;
  if (distance) route.distance = parseFloat(distance);
  if (status) route.status = status;
  
  // Parse stops if provided as string
  if (stops) {
    if (typeof stops === 'string') {
      try {
        route.stops = JSON.parse(stops);
      } catch (e) {
        // Invalid JSON, ignore
      }
    } else if (Array.isArray(stops)) {
      route.stops = stops;
    }
  }
  
  // Save changes
  await route.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      route
    }
  });
});

/**
 * Delete route
 * @route DELETE /api/transport/routes/:id
 * @access Admin
 */
exports.deleteRoute = catchAsync(async (req, res, next) => {
  const route = await TransportationRoute.findById(req.params.id);
  
  if (!route) {
    return next(new AppError('Route not found', 404));
  }
  
  // Check if vehicles are assigned to this route
  const vehicleCount = await TransportVehicle.countDocuments({ route: req.params.id });
  
  if (vehicleCount > 0) {
    return next(new AppError('Cannot delete route with assigned vehicles', 400));
  }
  
  // Check if students are registered to this route
  const registrationCount = await TransportRegistration.countDocuments({ route: req.params.id });
  
  if (registrationCount > 0) {
    return next(new AppError('Cannot delete route with registered students', 400));
  }
  
  // Delete route map if exists
  if (route.routeMapAttachment) {
    await fileService.deleteFile(route.routeMapAttachment);
  }
  
  // Delete route
  await TransportationRoute.findByIdAndDelete(req.params.id);
  
  res.status(200).json({
    status: 'success',
    message: 'Route deleted successfully',
    data: null
  });
});

/**
 * Get all vehicles
 * @route GET /api/transport/vehicles
 * @access Admin
 */
exports.getAllVehicles = catchAsync(async (req, res, next) => {
  const { status, route } = req.query;
  
  // Build query
  const query = {};
  if (status) query.status = status;
  if (route) query.route = route;
  
  const vehicles = await TransportVehicle.find(query)
    .populate('route', 'name routeNumber')
    .sort({ vehicleNumber: 1 });
  
  res.status(200).json({
    status: 'success',
    results: vehicles.length,
    data: {
      vehicles
    }
  });
});

/**
 * Create new vehicle
 * @route POST /api/transport/vehicles
 * @access Admin
 */
exports.createVehicle = catchAsync(async (req, res, next) => {
  const {
    vehicleNumber,
    vehicleType,
    make,
    model,
    capacity,
    driverName,
    driverContact,
    route,
    status
  } = req.body;
  
  // Validate vehicle number
  if (!vehicleNumber) {
    return next(new AppError('Vehicle number is required', 400));
  }
  
  // Check if vehicle exists
  const existingVehicle = await TransportVehicle.findOne({ vehicleNumber });
  
  if (existingVehicle) {
    return next(new AppError('Vehicle with this number already exists', 400));
  }
  
  // Create vehicle
  const vehicle = await TransportVehicle.create({
    vehicleNumber,
    vehicleType,
    make,
    model,
    capacity: parseInt(capacity) || 0,
    driverName,
    driverContact,
    route,
    status: status || 'active'
  });
  
  // Populate route for response
  if (route) {
    await vehicle.populate('route', 'name routeNumber');
  }
  
  res.status(201).json({
    status: 'success',
    data: {
      vehicle
    }
  });
});

/**
 * Update vehicle
 * @route PATCH /api/transport/vehicles/:id
 * @access Admin
 */
exports.updateVehicle = catchAsync(async (req, res, next) => {
  const vehicle = await TransportVehicle.findById(req.params.id);
  
  if (!vehicle) {
    return next(new AppError('Vehicle not found', 404));
  }
  
  // Update fields
  const allowedFields = [
    'vehicleNumber', 'vehicleType', 'make', 'model', 'capacity',
    'driverName', 'driverContact', 'route', 'status'
  ];
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      vehicle[field] = req.body[field];
    }
  });
  
  // Parse capacity as integer
  if (req.body.capacity) {
    vehicle.capacity = parseInt(req.body.capacity);
  }
  
  // Save changes
  await vehicle.save();
  
  // Populate route for response
  await vehicle.populate('route', 'name routeNumber');
  
  res.status(200).json({
    status: 'success',
    data: {
      vehicle
    }
  });
});

/**
 * Register student for transportation
 * @route POST /api/transport/register
 * @access Admin, Student
 */
exports.registerStudent = catchAsync(async (req, res, next) => {
  const { studentId, routeId, academicYearId, boardingStop } = req.body;
  
  // Validate student
  const student = await Student.findById(studentId);
  if (!student) {
    return next(new AppError('Student not found', 404));
  }
  
  // Validate route
  const route = await TransportationRoute.findById(routeId);
  if (!route) {
    return next(new AppError('Route not found', 404));
  }
  
  // Check if student is already registered
  const existingRegistration = await TransportRegistration.findOne({
    student: studentId,
    academicYear: academicYearId,
    status: 'active'
  });
  
  if (existingRegistration) {
    return next(new AppError('Student is already registered for transportation', 400));
  }
  
  // Create registration
  const registration = await TransportRegistration.create({
    student: studentId,
    route: routeId,
    academicYear: academicYearId,
    boardingStop,
    status: 'active'
  });
  
  // Populate for response
  await registration
    .populate('student', 'name admissionNo')
    .populate('route', 'name routeNumber')
    .populate('academicYear', 'yearName');
  
  res.status(201).json({
    status: 'success',
    data: {
      registration
    }
  });
});

/**
 * Get student registrations
 * @route GET /api/transport/registrations/student/:studentId
 * @access Admin, Student
 */
exports.getStudentRegistrations = catchAsync(async (req, res, next) => {
  const { studentId } = req.params;
  
  const registrations = await TransportRegistration.find({ student: studentId })
    .populate('route', 'name routeNumber startLocation endLocation')
    .populate('academicYear', 'yearName')
    .sort({ createdAt: -1 });
  
  res.status(200).json({
    status: 'success',
    results: registrations.length,
    data: {
      registrations
    }
  });
});

/**
 * Get route registrations
 * @route GET /api/transport/registrations/route/:routeId
 * @access Admin
 */
exports.getRouteRegistrations = catchAsync(async (req, res, next) => {
  const { routeId } = req.params;
  const { academicYearId, status } = req.query;
  
  // Build query
  const query = { route: routeId };
  if (academicYearId) query.academicYear = academicYearId;
  if (status) query.status = status;
  
  const registrations = await TransportRegistration.find(query)
    .populate('student', 'name admissionNo')
    .populate('academicYear', 'yearName')
    .sort({ student: 1 });
  
  res.status(200).json({
    status: 'success',
    results: registrations.length,
    data: {
      registrations
    }
  });
});