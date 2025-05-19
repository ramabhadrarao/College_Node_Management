// validators/faculty.validator.js
const { body } = require('express-validator');

exports.register = [
  body('regdno')
    .trim()
    .notEmpty().withMessage('Registration number is required')
    .isLength({ min: 3 }).withMessage('Registration number must be at least 3 characters long'),
  
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isAlpha().withMessage('First name must contain only alphabetic characters'),
  
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isAlpha().withMessage('Last name must contain only alphabetic characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('contactNo')
    .trim()
    .notEmpty().withMessage('Contact number is required')
    .matches(/^[0-9+\s-]{10,15}$/).withMessage('Please provide a valid contact number'),
  
  body('gender')
    .trim()
    .notEmpty().withMessage('Gender is required')
    .isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other'),
  
  body('department')
    .notEmpty().withMessage('Department is required'),
  
  body('designation')
    .trim()
    .notEmpty().withMessage('Designation is required'),
  
  body('joinDate')
    .notEmpty().withMessage('Join date is required')
    .isDate().withMessage('Join date must be a valid date')
];

exports.update = [
  body('firstName')
    .optional()
    .trim()
    .isAlpha().withMessage('First name must contain only alphabetic characters'),
  
  body('lastName')
    .optional()
    .trim()
    .isAlpha().withMessage('Last name must contain only alphabetic characters'),
  
  body('contactNo')
    .optional()
    .trim()
    .matches(/^[0-9+\s-]{10,15}$/).withMessage('Please provide a valid contact number'),
  
  body('department')
    .optional(),
  
  body('designation')
    .optional()
    .trim(),
  
  body('qualification')
    .optional()
    .trim(),
  
  body('specialization')
    .optional()
    .trim(),
  
  body('address')
    .optional()
    .trim(),
  
  body('bloodGroup')
    .optional()
    .trim()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Please provide a valid blood group'),
  
  body('additionalDetails')
    .optional()
    .isObject().withMessage('Additional details must be an object')
];

exports.changeStatus = [
  body('status')
    .trim()
    .notEmpty().withMessage('Status is required')
    .isIn(['active', 'inactive', 'pending', 'rejected']).withMessage('Status must be active, inactive, pending, or rejected'),
  
  body('reason')
    .optional()
    .trim()
];

exports.addAcademicInfo = [
  body('infoType')
    .trim()
    .notEmpty().withMessage('Information type is required')
    .isIn(['qualification', 'experience', 'publication', 'workshop']).withMessage('Invalid information type'),
  
  // Common fields
  body('title')
    .if(body('infoType').isIn(['publication', 'workshop']))
    .trim()
    .notEmpty().withMessage('Title is required'),
  
  body('visibility')
    .optional()
    .trim()
    .isIn(['show', 'hide']).withMessage('Visibility must be show or hide'),
  
  // Qualification fields
  body('degree')
    .if(body('infoType').equals('qualification'))
    .trim()
    .notEmpty().withMessage('Degree is required'),
  
  body('institution')
    .if(body('infoType').equals('qualification'))
    .trim()
    .notEmpty().withMessage('Institution is required'),
  
  // Experience fields
  body('institutionName')
    .if(body('infoType').equals('experience'))
    .trim()
    .notEmpty().withMessage('Institution name is required'),
  
  body('experienceType')
    .if(body('infoType').equals('experience'))
    .trim()
    .notEmpty().withMessage('Experience type is required'),
  
  body('designation')
    .if(body('infoType').equals('experience'))
    .trim()
    .notEmpty().withMessage('Designation is required'),
  
  // Publication fields
  body('journalName')
    .if(body('infoType').equals('publication'))
    .trim()
    .notEmpty().withMessage('Journal name is required'),
  
  // Workshop fields
  body('organizedBy')
    .if(body('infoType').equals('workshop'))
    .trim()
    .notEmpty().withMessage('Organizer information is required')
];