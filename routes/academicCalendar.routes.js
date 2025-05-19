// routes/academicCalendar.routes.js
const express = require('express');
const router = express.Router();
const academicCalendarController = require('../controllers/academicCalendar.controller');
const { protect, restrictTo } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validator');
const upload = require('../middlewares/fileUpload');

// All routes require authentication
router.use(protect);

// Routes accessible to Admin and HOD
router.route('/')
  .get(academicCalendarController.getCalendarEntries)
  .post(
    restrictTo('Admin', 'HOD'),
    validateBody([
      'academicYear',
      'semester',
      'calendarDate',
      'dayType'
    ]),
    academicCalendarController.createCalendarEntry
  );

router.route('/:id')
  .patch(
    restrictTo('Admin', 'HOD'),
    academicCalendarController.updateCalendarEntry
  )
  .delete(
    restrictTo('Admin', 'HOD'),
    academicCalendarController.deleteCalendarEntry
  );

router.post(
  '/bulk-import',
  restrictTo('Admin', 'HOD'),
  upload.single('file'),
  academicCalendarController.bulkImportCalendar
);

module.exports = router;