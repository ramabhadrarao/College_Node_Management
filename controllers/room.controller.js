// controllers/room.controller.js
const Room = require('../models/Room');
const Timetable = require('../models/Timetable');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Create room
exports.createRoom = catchAsync(async (req, res, next) => {
  const {
    roomNumber,
    building,
    floor,
    roomType,
    capacity,
    hasProjector,
    hasComputer,
    hasAC,
    status
  } = req.body;
  
  // Check if room already exists
  const existingRoom = await Room.findOne({ roomNumber, building });
  
  if (existingRoom) {
    return next(new AppError('Room with this number and building already exists', 400));
  }
  
  // Create room
  const room = await Room.create({
    roomNumber,
    building,
    floor: parseInt(floor) || 0,
    roomType: roomType || 'Classroom',
    capacity: parseInt(capacity) || 0,
    hasProjector: hasProjector === 'true' || hasProjector === true,
    hasComputer: hasComputer === 'true' || hasComputer === true,
    hasAC: hasAC === 'true' || hasAC === true,
    status: status || 'active'
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      room
    }
  });
});

// Get rooms
exports.getRooms = catchAsync(async (req, res, next) => {
  const { building, floor, roomType, status, hasProjector, hasComputer, hasAC } = req.query;
  
  // Build query
  const query = {};
  
  if (building) query.building = building;
  if (floor) query.floor = parseInt(floor);
  if (roomType) query.roomType = roomType;
  if (status) query.status = status;
  if (hasProjector) query.hasProjector = hasProjector === 'true';
  if (hasComputer) query.hasComputer = hasComputer === 'true';
  if (hasAC) query.hasAC = hasAC === 'true';
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  
  // Execute query
  const [rooms, total] = await Promise.all([
    Room.find(query)
      .sort({ building: 1, floor: 1, roomNumber: 1 })
      .skip(skip)
      .limit(limit),
    Room.countDocuments(query)
  ]);
  
  res.status(200).json({
    status: 'success',
    results: rooms.length,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    },
    data: {
      rooms
    }
  });
});

// Get room by ID
exports.getRoomById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const room = await Room.findById(id);
  
  if (!room) {
    return next(new AppError('Room not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      room
    }
  });
});

// Update room
exports.updateRoom = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const {
    roomNumber,
    building,
    floor,
    roomType,
    capacity,
    hasProjector,
    hasComputer,
    hasAC,
    status
  } = req.body;
  
  // Find the room
  const room = await Room.findById(id);
  
  if (!room) {
    return next(new AppError('Room not found', 404));
  }
  
  // Check if room number and building combination already exists
  if (roomNumber && building && (roomNumber !== room.roomNumber || building !== room.building)) {
    const existingRoom = await Room.findOne({
      _id: { $ne: id },
      roomNumber,
      building
    });
    
    if (existingRoom) {
      return next(new AppError('Room with this number and building already exists', 400));
    }
  }
  
  // Update fields
  if (roomNumber) room.roomNumber = roomNumber;
  if (building) room.building = building;
  if (floor) room.floor = parseInt(floor);
  if (roomType) room.roomType = roomType;
  if (capacity) room.capacity = parseInt(capacity);
  if (hasProjector !== undefined) room.hasProjector = hasProjector === 'true' || hasProjector === true;
  if (hasComputer !== undefined) room.hasComputer = hasComputer === 'true' || hasComputer === true;
  if (hasAC !== undefined) room.hasAC = hasAC === 'true' || hasAC === true;
  if (status) room.status = status;
  
  // Save changes
  await room.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      room
    }
  });
});

// Delete room
exports.deleteRoom = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  // Check if room is used in timetable
  const timetableEntries = await Timetable.countDocuments({ room: id });
  
  if (timetableEntries > 0) {
    return next(new AppError('Cannot delete room that is used in timetable', 400));
  }
  
  const room = await Room.findByIdAndDelete(id);
  
  if (!room) {
    return next(new AppError('Room not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Room deleted successfully',
    data: null
  });
});

// Get room availability for a day
exports.getRoomAvailability = catchAsync(async (req, res, next) => {
  const { roomId } = req.params;
  const { date, semester, academicYear } = req.query;
  
  // Validate required parameters
  if (!semester || !academicYear) {
    return next(new AppError('Semester and academic year are required', 400));
  }
  
  // Check if room exists
  const room = await Room.findById(roomId);
  
  if (!room) {
    return next(new AppError('Room not found', 404));
  }
  
  // Get day of week from date
  let dayOfWeek;
  if (date) {
    const requestedDate = new Date(date);
    dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][requestedDate.getDay()];
  } else {
    // Default to current day
    const today = new Date();
    dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
  }
  
  // Get all periods
  const allPeriods = [1, 2, 3, 4, 5, 6, 7, 8]; // Assuming 8 periods per day
  
  // Get timetable entries for the room
  const timetableEntries = await Timetable.find({
    room: roomId,
    dayOfWeek,
    semester,
    academicYear
  })
    .populate('course', 'name courseCode')
    .populate('faculty', 'firstName lastName')
    .sort({ period: 1 });
  
  // Create availability map
  const occupiedPeriods = timetableEntries.map(entry => ({
    period: entry.period,
    courseName: entry.course.name,
    courseCode: entry.course.courseCode,
    faculty: `${entry.faculty.firstName} ${entry.faculty.lastName}`,
    startTime: entry.startTime,
    endTime: entry.endTime
  }));
  
  const occupiedPeriodNumbers = occupiedPeriods.map(p => p.period);
  
  const availability = allPeriods.map(period => ({
    period,
    isAvailable: !occupiedPeriodNumbers.includes(period),
    booking: occupiedPeriods.find(p => p.period === period)
  }));
  
  res.status(200).json({
    status: 'success',
    data: {
      room,
      dayOfWeek,
      availability
    }
  });
});