// routes/scholarship.routes.js
const express = require('express');
const router = express.Router();
const scholarshipController = require('../controllers/scholarship.controller');
const { protect, restrictTo } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validator');
const upload = require('../middlewares/fileUpload');

// All routes require authentication
router.use(protect);

// Scholarship type routes
router.route('/types')
  .get(scholarshipController.getAllScholarshipTypes)
  .post(
    restrictTo('Admin'),
    validateBody([
      'name'
    ]),
    scholarshipController.createScholarshipType
  );

// Update scholarship type
router.patch(
  '/types/:id',
  restrictTo('Admin'),
  scholarshipController.updateScholarshipType
);

// Award scholarship
router.post(
  '/award',
  restrictTo('Admin'),
  upload.single('attachment'),
  validateBody([
    'studentId',
    'scholarshipTypeId',
    'academicYearId',
    'amount'
  ]),
  scholarshipController.awardScholarship
);

// Get student scholarships
router.get(
  '/student/:studentId',
  scholarshipController.getStudentScholarships
);

// Update scholarship status
router.patch(
  '/:id/status',
  restrictTo('Admin'),
  validateBody([
    'status'
  ]),
  scholarshipController.updateScholarshipStatus
);

// Generate scholarship report
router.get(
  '/report',
  restrictTo('Admin'),
  scholarshipController.generateScholarshipReport
);

module.exports = router;