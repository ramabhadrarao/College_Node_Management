// routes/attendance.routes.js
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { protect, restrictTo, hasPermission } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validator');

// All routes require authentication
router.use(protect);

// Mark attendance (for faculty)
router.post(
  '/mark',
  hasPermission('attendance_mark'),
  validateBody([
    'student',
    'course',
    'section',
    'academicYear',
    'semester',
    'attendanceDate',
    'status'
  ]),
  attendanceController.markAttendance
);

// Batch update attendance (for faculty)
router.post(
  '/batch',
  hasPermission('attendance_mark'),
  validateBody([
    'course',
    'section',
    'attendanceDate',
    'studentAttendance'
  ]),
  attendanceController.batchUpdateAttendance
);

// Get student attendance
router.get(
  '/student/:studentId',
  attendanceController.getStudentAttendance
);

// Get course attendance
router.get(
  '/course',
  hasPermission('attendance_view'),
  attendanceController.getCourseAttendance
);

// Get attendance summary
router.get(
  '/summary',
  attendanceController.getAttendanceSummary
);

// Update attendance summaries
router.post(
  '/update-summaries',
  restrictTo('Admin', 'HOD', 'Faculty'),
  validateBody([
    'course',
    'section',
    'semester',
    'academicYear'
  ]),
  attendanceController.updateAttendanceSummaries
);

// Export attendance report
router.get(
  '/export',
  hasPermission('attendance_report'),
  attendanceController.exportAttendanceReport
);

module.exports = router;