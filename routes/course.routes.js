// routes/course.routes.js
const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const { protect, restrictTo } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validator');
const upload = require('../middlewares/fileUpload');

// All routes require authentication
router.use(protect);

// Course routes
router.route('/')
  .get(courseController.getCourses)
  .post(
    restrictTo('Admin', 'HOD'),
    upload.fields([
      { name: 'syllabus', maxCount: 1 }
    ]),
    validateBody([
      'courseCode',
      'name',
      'semester',
      'branch',
      'regulation',
      'courseType',
      'credits'
    ]),
    courseController.createCourse
  );

// Course specific routes
router.route('/:id')
  .get(courseController.getCourseById)
  .patch(
    restrictTo('Admin', 'HOD'),
    upload.fields([
      { name: 'syllabus', maxCount: 1 }
    ]),
    courseController.updateCourse
  )
  .delete(
    restrictTo('Admin', 'HOD'),
    courseController.deleteCourse
  );

// Course section routes
router.route('/:courseId/sections')
  .get(courseController.getCourseSections)
  .post(
    restrictTo('Admin', 'HOD'),
    validateBody([
      'sectionName',
      'sectionType'
    ]),
    courseController.createCourseSection
  );

// Course section specific routes
router.route('/sections/:id')
  .patch(
    restrictTo('Admin', 'HOD'),
    courseController.updateCourseSection
  )
  .delete(
    restrictTo('Admin', 'HOD'),
    courseController.deleteCourseSection
  );

// Elective group routes
router.route('/electives/groups')
  .get(courseController.getElectiveGroups)
  .post(
    restrictTo('Admin', 'HOD'),
    validateBody([
      'name',
      'semester',
      'electiveType'
    ]),
    courseController.createElectiveGroup
  );

// Elective group courses
router.route('/electives/groups/:electiveGroupId/courses')
  .get(courseController.getElectiveGroupCourses)
  .post(
    restrictTo('Admin', 'HOD'),
    validateBody([
      'courseId',
      'sectionId'
    ]),
    courseController.addCourseToElectiveGroup
  );

// Remove course from elective group
router.delete(
  '/electives/groups/:electiveGroupId/courses/:courseId',
  restrictTo('Admin', 'HOD'),
  courseController.removeCourseFromElectiveGroup
);

module.exports = router;