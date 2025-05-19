// routes/dashboard.routes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { protect, restrictTo } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validator');
const { body } = require('express-validator');

// All routes require authentication
router.use(protect);

// Admin dashboard
router.get(
  '/admin',
  restrictTo('Admin'),
  dashboardController.getAdminDashboard
);

// Faculty dashboard
router.get(
  '/faculty/:facultyId',
  dashboardController.getFacultyDashboard
);

// Student dashboard
router.get(
  '/student/:studentId',
  dashboardController.getStudentDashboard
);

// Generate reports
router.post(
  '/reports',
  restrictTo('Admin', 'HOD'),
  validateBody([
    body('reportType').notEmpty().withMessage('Report type is required')
  ]),
  dashboardController.generateReport
);

module.exports = router;