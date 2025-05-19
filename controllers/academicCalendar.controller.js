// controllers/academicCalendar.controller.js
const AcademicCalendar = require('../models/AcademicCalendar');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Create academic calendar entry
exports.createCalendarEntry = catchAsync(async (req, res, next) => {
  const { academicYear, semester, calendarDate, dayType, description } = req.body;
  
  const calendarEntry = await AcademicCalendar.create({
    academicYear,
    semester,
    calendarDate,
    dayType,
    description,
    isActive: true
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      calendarEntry
    }
  });
});

// Get all calendar entries with filters
exports.getCalendarEntries = catchAsync(async (req, res, next) => {
  const { academicYear, semester, dayType, fromDate, toDate } = req.query;
  
  // Build query
  const query = {};
  if (academicYear) query.academicYear = academicYear;
  if (semester) query.semester = semester;
  if (dayType) query.dayType = dayType;
  
  // Date range filter
  if (fromDate || toDate) {
    query.calendarDate = {};
    if (fromDate) query.calendarDate.$gte = new Date(fromDate);
    if (toDate) query.calendarDate.$lte = new Date(toDate);
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 30;
  const skip = (page - 1) * limit;
  
  // Execute query
  const [entries, total] = await Promise.all([
    AcademicCalendar.find(query)
      .populate('academicYear', 'yearName')
      .populate('semester', 'name')
      .sort({ calendarDate: 1 })
      .skip(skip)
      .limit(limit),
    AcademicCalendar.countDocuments(query)
  ]);
  
  res.status(200).json({
    status: 'success',
    results: entries.length,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    },
    data: {
      entries
    }
  });
});

// Update calendar entry
exports.updateCalendarEntry = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { dayType, description, isActive } = req.body;
  
  const updatedEntry = await AcademicCalendar.findByIdAndUpdate(
    id,
    { dayType, description, isActive },
    { new: true, runValidators: true }
  );
  
  if (!updatedEntry) {
    return next(new AppError('Calendar entry not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      calendarEntry: updatedEntry
    }
  });
});

// Delete calendar entry
exports.deleteCalendarEntry = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const deletedEntry = await AcademicCalendar.findByIdAndDelete(id);
  
  if (!deletedEntry) {
    return next(new AppError('Calendar entry not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: null
  });
});

// Bulk import calendar entries
exports.bulkImportCalendar = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a file', 400));
  }
  
  const fileData = await fileService.processFile(req.file.buffer, req.file.mimetype);
  
  // Transform data for import
  const calendarEntries = fileData.map(row => ({
    academicYear: row.academicYearId,
    semester: row.semesterId,
    calendarDate: new Date(row.date),
    dayType: row.dayType,
    description: row.description,
    isActive: true
  }));
  
  // Insert data
  const result = await AcademicCalendar.insertMany(calendarEntries);
  
  res.status(201).json({
    status: 'success',
    message: `${result.length} calendar entries imported successfully`,
    data: {
      count: result.length
    }
  });
});