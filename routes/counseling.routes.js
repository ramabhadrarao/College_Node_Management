// routes/counseling.routes.js
const express = require('express');
const router = express.Router();
const counselingController = require('../controllers/counseling.controller');
const { protect, restrictTo } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validator');

// All routes require authentication
router.use(protect);

// Counselor routes
router.route('/counselors')
  .get(counselingController.getAllCounselors)
  .post(
    restrictTo('Admin'),
    validateBody([
      'name',
      'specialization',
      'contactNo',
      'email'
    ]),
    counselingController.createCounselor
  );

// Counseling services routes
router.route('/services')
  .get(counselingController.getAllServices)
  .post(
    restrictTo('Admin'),
    validateBody([
      'name',
      'serviceType'
    ]),
    counselingController.createService
  );

// Appointment routes
router.route('/appointments')
  .post(
    validateBody([
      'studentId',
      'counselorId',
      'serviceId',
      'appointmentDate',
      'appointmentTime'
    ]),
    counselingController.scheduleAppointment
  );

// Student appointments
router.get(
  '/appointments/student/:studentId',
  counselingController.getStudentAppointments
);

// Counselor appointments
router.get(
  '/appointments/counselor/:counselorId',
  restrictTo('Admin', 'Staff'),
  counselingController.getCounselorAppointments
);

// Update appointment status
router.patch(
  '/appointments/:id/status',
  restrictTo('Admin', 'Staff'),
  validateBody([
    'status'
  ]),
  counselingController.updateAppointmentStatus
);

module.exports = router;