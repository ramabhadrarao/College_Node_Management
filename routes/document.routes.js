// routes/document.routes.js
const express = require('express');
const router = express.Router();
const documentController = require('../controllers/document.controller');
const { protect, restrictTo } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validator');
const upload = require('../middlewares/fileUpload');

// All routes require authentication
router.use(protect);

// Document category routes
router.route('/categories')
  .get(documentController.getCategories)
  .post(
    restrictTo('Admin'),
    validateBody([
      'name'
    ]),
    documentController.createCategory
  );

// Document routes
router.route('/')
  .get(documentController.getDocuments)
  .post(
    upload.single('file'),
    validateBody([
      'title',
      'documentCategory'
    ]),
    documentController.uploadDocument
  );

// Document specific routes
router.route('/:id')
  .get(documentController.getDocumentById)
  .patch(
    upload.single('file'),
    documentController.updateDocument
  )
  .delete(
    documentController.deleteDocument
  );

// Archive document
router.patch(
  '/:id/archive',
  documentController.archiveDocument
);

module.exports = router;