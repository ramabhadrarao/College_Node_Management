// Fixed routes/faculty.routes.js
const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/faculty.controller');
const { protect, restrictTo, hasPermission, checkResourceAccess } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validator');
const upload = require('../middlewares/fileUpload');
const facultyValidator = require('../validators/faculty.validator');

// Public routes
router.post('/register', 
  upload.fields([
    { name: 'photo', maxCount: 1 }, 
    { name: 'aadhar', maxCount: 1 },
    { name: 'pan', maxCount: 1 }
  ]),
  validateBody(facultyValidator.register), 
  facultyController.register
);

// Protected routes (require authentication)
router.use(protect);

// Routes accessible to Admin and HOD
router.get('/', 
  restrictTo('Admin', 'HOD'), 
  facultyController.getAllFaculty
);

router.get('/stats', 
  restrictTo('Admin', 'HOD'), 
  facultyController.getFacultyStats
);

router.patch('/:id/status', 
  restrictTo('Admin', 'HOD'), 
  validateBody(facultyValidator.changeStatus), 
  facultyController.changeFacultyStatus
);

router.patch('/:id/toggle-edit', 
  restrictTo('Admin', 'HOD'), 
  facultyController.toggleEditStatus
);

// Routes accessible to the faculty owner or admin
router.get('/:id', 
  checkResourceAccess('profile_view', 'faculty', 'id'),
  facultyController.getFacultyById
);

router.patch('/:id', 
  checkResourceAccess('profile_edit', 'faculty', 'id'),
  upload.fields([
    { name: 'photo', maxCount: 1 }, 
    { name: 'aadhar', maxCount: 1 },
    { name: 'pan', maxCount: 1 }
  ]),
  validateBody(facultyValidator.update), 
  facultyController.updateFaculty
);

// Academic information routes
router.post('/:id/academics', 
  checkResourceAccess('profile_edit', 'faculty', 'id'),
  upload.single('attachment'),
  validateBody(facultyValidator.addAcademicInfo), 
  facultyController.addAcademicInfo
);

router.get('/:id/academics/:infoType', 
  facultyController.getAcademicInfo
);

module.exports = router;