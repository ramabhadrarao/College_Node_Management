// routes/fee.routes.js
const express = require('express');
const router = express.Router();
const feeController = require('../controllers/fee.controller');
const { protect, restrictTo } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validator');
const upload = require('../middlewares/fileUpload');

// All routes require authentication
router.use(protect);

// Fee structure routes
router.route('/structure')
  .get(feeController.getFeeStructures)
  .post(
    restrictTo('Admin'),
    validateBody([
      'batch',
      'program',
      'feeType',
      'amount',
      'effectiveFrom'
    ]),
    feeController.createFeeStructure
  );

// Fee type routes
router.route('/types')
  .get(feeController.getFeeTypes)
  .post(
    restrictTo('Admin'),
    validateBody([
      'name'
    ]),
    feeController.createFeeType
  );

// Invoice routes
router.route('/invoices')
  .post(
    restrictTo('Admin'),
    validateBody([
      'student',
      'semester',
      'academicYear',
      'items',
      'dueDate'
    ]),
    feeController.generateInvoice
  );

// Get student invoices
router.get(
  '/invoices/student/:studentId',
  feeController.getStudentInvoices
);

// Payment routes
router.route('/payments')
  .post(
    restrictTo('Admin'),
    validateBody([
      'invoice',
      'paymentMethod',
      'paymentDate',
      'amount'
    ]),
    feeController.recordPayment
  );

// Get invoice payments
router.get(
  '/payments/invoice/:invoiceId',
  feeController.getInvoicePayments
);

// Waiver routes
router.route('/waivers')
  .post(
    restrictTo('Admin'),
    validateBody([
      'student',
      'feeType',
      'academicYear',
      'waiverPercentage',
      'waiverReason'
    ]),
    feeController.createWaiver
  );

// Get student waivers
router.get(
  '/waivers/student/:studentId',
  feeController.getStudentWaivers
);

// Fee reports
router.get(
  '/reports',
  restrictTo('Admin'),
  feeController.generateFeeReport
);

module.exports = router;