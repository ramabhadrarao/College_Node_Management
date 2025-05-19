// validators/student.validator.js
const { body } = require('express-validator');

exports.register = [
  body('admissionNo')
    .trim()
    .notEmpty().withMessage('Admission number is required')
    .isLength({ min: 3 }).withMessage('Admission number must be at least 3 characters long'),
  
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('mobile')
    .trim()
    .notEmpty().withMessage('Mobile number is required')
    .matches(/^[0-9+\s-]{10,15}$/).withMessage('Please provide a valid mobile number'),
  
  body('gender')
    .trim()
    .notEmpty().withMessage('Gender is required')
    .isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other'),
  
  body('batch')
    .notEmpty().withMessage('Batch is required'),
  
  body('program')
    .notEmpty().withMessage('Program is required'),
  
  body('branch')
    .notEmpty().withMessage('Branch is required'),
  
  body('regulation')
    .notEmpty().withMessage('Regulation is required'),
  
  body('studentType')
    .trim()
    .notEmpty().withMessage('Student type is required')
    .isIn(['Day Scholar', 'Hosteler', 'Day Scholar College Bus']).withMessage('Invalid student type'),
  
  body('nationality')
    .trim()
    .notEmpty().withMessage('Nationality is required'),
  
  body('religion')
    .trim()
    .notEmpty().withMessage('Religion is required'),
  
  body('dob')
    .notEmpty().withMessage('Date of birth is required')
    .isDate().withMessage('Date of birth must be a valid date')
];

exports.update = [
  body('name')
    .optional()
    .trim(),
  
  body('mobile')
    .optional()
    .trim()
    .matches(/^[0-9+\s-]{10,15}$/).withMessage('Please provide a valid mobile number'),
  
  body('gender')
    .optional()
    .trim()
    .isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other'),
  
  body('fatherName')
    .optional()
    .trim(),
  
  body('motherName')
    .optional()
    .trim(),
  
  body('fatherMobile')
    .optional()
    .trim()
    .matches(/^[0-9+\s-]{10,15}$/).withMessage('Please provide a valid mobile number'),
  
  body('motherMobile')
    .optional()
    .trim()
    .matches(/^[0-9+\s-]{10,15}$/).withMessage('Please provide a valid mobile number'),
  
  body('address')
    .optional()
    .trim(),
  
  body('permanentAddress')
    .optional()
    .trim(),
  
  body('bloodGroup')
    .optional()
    .trim()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Please provide a valid blood group'),
  
  body('nationality')
    .optional()
    .trim(),
  
  body('religion')
    .optional()
    .trim(),
  
  body('caste')
    .optional()
    .trim(),
  
  body('subCaste')
    .optional()
    .trim(),
  
  body('dob')
    .optional()
    .isDate().withMessage('Date of birth must be a valid date')
];

exports.changeStatus = [
  body('status')
    .trim()
    .notEmpty().withMessage('Status is required')
    .isIn(['active', 'inactive', 'graduated', 'suspended', 'withdrawn']).withMessage('Invalid status value'),
  
  body('reason')
    .optional()
    .trim()
];

exports.addEducationalDetail = [
  body('courseName')
    .trim()
    .notEmpty().withMessage('Course name is required'),
  
  body('yearOfPassing')
    .notEmpty().withMessage('Year of passing is required')
    .isInt({ min: 1900, max: new Date().getFullYear() }).withMessage('Please provide a valid year'),
  
  body('classDivision')
    .trim()
    .notEmpty().withMessage('Class/Division is required'),
  
  body('percentageGrade')
    .trim()
    .notEmpty().withMessage('Percentage/Grade is required'),
  
  body('boardUniversity')
    .trim()
    .notEmpty().withMessage('Board/University is required')
];