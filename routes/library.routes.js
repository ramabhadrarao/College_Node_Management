// routes/library.routes.js
const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/library.controller');
const { protect, restrictTo } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validator');
const upload = require('../middlewares/fileUpload');

// All routes require authentication
router.use(protect);

// Book category routes
router.route('/categories')
  .get(libraryController.getBookCategories)
  .post(
    restrictTo('Admin', 'Librarian'),
    validateBody([
      'name'
    ]),
    libraryController.createBookCategory
  );

// Book routes
router.route('/books')
  .get(libraryController.getBooks)
  .post(
    restrictTo('Admin', 'Librarian'),
    upload.single('coverImage'),
    validateBody([
      'title',
      'author'
    ]),
    libraryController.addBook
  );

// Book specific routes
router.route('/books/:id')
  .get(libraryController.getBookById)
  .patch(
    restrictTo('Admin', 'Librarian'),
    upload.single('coverImage'),
    libraryController.updateBook
  )
  .delete(
    restrictTo('Admin', 'Librarian'),
    libraryController.deleteBook
  );

// Transaction routes
router.route('/transactions')
  .post(
    restrictTo('Admin', 'Librarian'),
    validateBody([
      'bookId',
      'userId'
    ]),
    libraryController.issueBook
  );

// Return book
router.post(
  '/transactions/return',
  restrictTo('Admin', 'Librarian'),
  validateBody([
    'transactionId'
  ]),
  libraryController.returnBook
);

// Renew book
router.post(
  '/transactions/renew',
  restrictTo('Admin', 'Librarian', 'Student', 'Faculty'),
  validateBody([
    'transactionId'
  ]),
  libraryController.renewBook
);

// Get user transactions
router.get(
  '/transactions/user/:userId',
  libraryController.getUserTransactions
);

// Reservation routes
router.route('/reservations')
  .post(
    validateBody([
      'bookId',
      'userId'
    ]),
    libraryController.reserveBook
  );

// Cancel reservation
router.post(
  '/reservations/cancel',
  validateBody([
    'reservationId'
  ]),
  libraryController.cancelReservation
);

// Get user reservations
router.get(
  '/reservations/user/:userId',
  libraryController.getUserReservations
);

// Library settings
router.route('/settings')
  .get(
    restrictTo('Admin', 'Librarian'),
    libraryController.getLibrarySettings
  );

// Update setting
router.put(
  '/settings/:key',
  restrictTo('Admin', 'Librarian'),
  validateBody([
    'value'
  ]),
  libraryController.updateLibrarySetting
);

// Library statistics
router.get(
  '/statistics',
  restrictTo('Admin', 'Librarian'),
  libraryController.getLibraryStatistics
);

module.exports = router;