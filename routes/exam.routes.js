// routes/exam.routes.js
const express = require('express');
const router = express.Router();
const examController = require('../controllers/exam.controller');
const { protect, restrictTo } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validator');

// All routes require authentication
router.use(protect);

// Exam type routes
router.route('/types')
  .get(examController.getExamTypes)
  .post(
    restrictTo('Admin'),
    validateBody([
      'name'
    ]),
    examController.createExamType
  );

// Exam schedule routes
router.route('/schedules')
  .get(examController.getExamSchedules)
  .post(
    restrictTo('Admin', 'HOD'),
    validateBody([
      'examType',
      'course',
      'semester',
      'academicYear',
      'examDate',
      'examStartTime',
      'examEndTime'
    ]),
    examController.createExamSchedule
  );

// Marks routes
router.route('/marks')
  .post(
    restrictTo('Admin', 'Faculty'),
    validateBody([
      'studentMarks'
    ]),
    examController.enterExamMarks
  );

// Get student marks
router.get(
  '/marks/student/:studentId',
  examController.getStudentExamMarks
);

// Course result calculation
router.post(
  '/results/course',
  restrictTo('Admin', 'Faculty'),
  validateBody([
    'student',
    'course',
    'semester',
    'academicYear'
  ]),
  examController.calculateCourseResult
);

// Semester result calculation
router.post(
  '/results/semester',
  restrictTo('Admin', 'HOD'),
  validateBody([
    'student',
    'semester',
    'academicYear'
  ]),
  examController.calculateSemesterResult
);

// Cumulative result calculation
router.post(
  '/results/cumulative',
  restrictTo('Admin', 'HOD'),
  validateBody([
    'student',
    'upToSemester'
  ]),
  examController.calculateCumulativeResult
);

// Get student results
router.get(
  '/results/student/:studentId',
  examController.getStudentResults
);

// Generate grade card
router.get(
  '/grade-card/:studentId/:semester/:academicYear',
  examController.generateGradeCard
);

module.exports = router;