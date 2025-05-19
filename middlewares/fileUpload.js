// middlewares/fileUpload.js
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const AppError = require('../utils/appError');
const config = require('../config/config');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, config.storage.uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(8).toString('hex');
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter - only allow certain file types
const fileFilter = (req, file, cb) => {
  // Accept images, PDFs, Excel, and Word documents
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/msword' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.mimetype === 'application/vnd.ms-excel' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.mimetype === 'text/csv'
  ) {
    cb(null, true);
  } else {
    cb(new AppError('Unsupported file type. Please upload an image, PDF, Word document, or Excel/CSV file.', 400), false);
  }
};

// Initialize multer with configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: config.storage.maxSize // Default 5MB
  }
});

module.exports = upload;