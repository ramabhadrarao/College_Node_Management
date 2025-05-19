// routes/timetable.routes.js
const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetable.controller');
const { protect, restrictTo } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validator');
const upload = require('../middlewares/fileUpload');

// All routes require authentication
router.use(protect);

// Timetable entry routes
router.route('/')
  .get(timetableController.getTimetableEntries)
  .post(
    restrictTo('Admin', 'HOD'),
    validateBody([
      'course',
      'faculty',
      'semester',
      'academicYear',
      'dayOfWeek',
      'period'
    ]),
    timetableController.createTimetableEntry
  );

// Timetable entry specific routes
router.route('/:id')
  .patch(
    restrictTo('Admin', 'HOD'),
    timetableController.updateTimetableEntry
  )
  .delete(
    restrictTo('Admin', 'HOD'),
    timetableController.deleteTimetableEntry
  );

// Faculty timetable
router.get(
  '/faculty/:facultyId',
  timetableController.getFacultyTimetable
);

// Room timetable
router.get(
  '/room/:roomId',
  timetableController.getRoomTimetable
);

// Section timetable
router.get(
  '/section/:sectionId',
  timetableController.getSectionTimetable
);

// Bulk import
router.post(
  '/bulk-import',
  restrictTo('Admin', 'HOD'),
  upload.single('file'),
  timetableController.bulkImportTimetable
);

module.exports = router;