// routes/academic.routes.js
const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academic.controller');
const { protect, restrictTo } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validator');

// All routes require authentication
router.use(protect);

// Academic year routes
router.route('/years')
  .get(academicController.getAllAcademicYears)
  .post(
    restrictTo('Admin'),
    validateBody([
      'yearName',
      'startDate',
      'endDate'
    ]),
    academicController.createAcademicYear
  );

router.route('/years/:id')
  .patch(
    restrictTo('Admin'),
    academicController.updateAcademicYear
  );

// Semester routes
router.route('/semesters')
  .get(academicController.getAllSemesters)
  .post(
    restrictTo('Admin'),
    validateBody([
      'name',
      'academicYear',
      'startDate',
      'endDate'
    ]),
    academicController.createSemester
  );

router.route('/semesters/:id/status')
  .patch(
    restrictTo('Admin'),
    validateBody([
      'status'
    ]),
    academicController.updateSemesterStatus
  );

// Batch routes
router.route('/batches')
  .get(academicController.getAllBatches)
  .post(
    restrictTo('Admin'),
    validateBody([
      'name',
      'program',
      'branch',
      'startYear',
      'endYear'
    ]),
    academicController.createBatch
  );

router.route('/batches/:id')
  .patch(
    restrictTo('Admin'),
    academicController.updateBatch
  );

// Working day adjustment routes
router.route('/working-day-adjustments')
  .get(academicController.getWorkingDayAdjustments)
  .post(
    restrictTo('Admin'),
    validateBody([
      'academicYear',
      'adjustmentDate',
      'adjustmentType'
    ]),
    academicController.createWorkingDayAdjustment
  );

// Academic term routes
router.route('/terms')
  .get(academicController.getAcademicTerms)
  .post(
    restrictTo('Admin'),
    validateBody([
      'name',
      'semester',
      'startDate',
      'endDate'
    ]),
    academicController.createAcademicTerm
  );

module.exports = router;