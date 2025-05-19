// routes/transport.routes.js
const express = require('express');
const router = express.Router();
const transportController = require('../controllers/transport.controller');
const { protect, restrictTo } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validator');
const upload = require('../middlewares/fileUpload');

// All routes require authentication
router.use(protect);

// Route routes
router.route('/routes')
  .get(transportController.getAllRoutes)
  .post(
    restrictTo('Admin'),
    upload.single('routeMap'),
    validateBody([
      'name',
      'startLocation',
      'endLocation'
    ]),
    transportController.createRoute
  );

// Route specific routes
router.route('/routes/:id')
  .get(transportController.getRouteById)
  .patch(
    restrictTo('Admin'),
    upload.single('routeMap'),
    transportController.updateRoute
  )
  .delete(
    restrictTo('Admin'),
    transportController.deleteRoute
  );

// Vehicle routes
router.route('/vehicles')
  .get(
    restrictTo('Admin'),
    transportController.getAllVehicles
  )
  .post(
    restrictTo('Admin'),
    validateBody([
      'vehicleNumber'
    ]),
    transportController.createVehicle
  );

// Vehicle specific routes
router.route('/vehicles/:id')
  .patch(
    restrictTo('Admin'),
    transportController.updateVehicle
  )
  .delete(
    restrictTo('Admin'),
    transportController.deleteVehicle
  );

// Registration routes
router.route('/register')
  .post(
    validateBody([
      'studentId',
      'routeId',
      'academicYearId'
    ]),
    transportController.registerStudent
  );

// Get student registrations
router.get(
  '/registrations/student/:studentId',
  transportController.getStudentRegistrations
);

// Get route registrations
router.get(
  '/registrations/route/:routeId',
  restrictTo('Admin'),
  transportController.getRouteRegistrations
);

// Update registration status
router.patch(
  '/registrations/:id/status',
  restrictTo('Admin'),
  validateBody([
    'status'
  ]),
  transportController.updateRegistrationStatus
);

module.exports = router;