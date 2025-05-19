// routes/student.routes.js
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { protect, restrictTo, hasPermission, checkResourceAccess } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validator');
const upload = require('../middlewares/fileUpload');
const studentValidator = require('../validators/student.validator');

// Routes accessible to Admin only
router.use(protect);
router.use(restrictTo('Admin'));

router.post('/register', 
  upload.fields([
    { name: 'photo', maxCount: 1 }, 
    { name: 'aadhar', maxCount: 1 },
    { name: 'fatherAadhar', maxCount: 1 },
    { name: 'motherAadhar', maxCount: 1 }
  ]),
  validateBody(studentValidator.register), 
  studentController.register
);

router.post('/register-bulk', 
  upload.single('file'),
  studentController.registerBulk
);

router.patch('/:id/status', 
  validateBody(studentValidator.changeStatus), 
  studentController.changeStudentStatus
);

// Routes accessible to Admin and Faculty
router.use(restrictTo('Admin', 'Faculty', 'HOD'));

router.get('/', 
  studentController.getAllStudents
);

router.get('/stats', 
  studentController.getStudentStats
);

// Routes accessible to the student owner, admin, or faculty
router.get('/:id', 
  checkResourceAccess('profile_view', 'student', 'id'),
  studentController.getStudentById
);

// Only student or admin can update
router.patch('/:id', 
  checkResourceAccess('profile_edit', 'student', 'id'),
  upload.fields([
    { name: 'photo', maxCount: 1 }, 
    { name: 'aadhar', maxCount: 1 }
  ]),
  validateBody(studentValidator.update), 
  studentController.updateStudent
);

module.exports = router;