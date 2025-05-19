// routes/learning.routes.js
const express = require('express');
const router = express.Router();
const learningController = require('../controllers/learning.controller');
const { protect, restrictTo } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validator');
const upload = require('../middlewares/fileUpload');

// All routes require authentication
router.use(protect);

// Course module routes
router.route('/courses/:courseId/modules')
  .get(learningController.getCourseModules)
  .post(
    restrictTo('Admin', 'Faculty'),
    validateBody([
      'title'
    ]),
    learningController.createCourseModule
  );

// Module routes
router.route('/modules/:id')
  .patch(
    restrictTo('Admin', 'Faculty'),
    learningController.updateCourseModule
  )
  .delete(
    restrictTo('Admin', 'Faculty'),
    learningController.deleteCourseModule
  );

// Module resources routes
router.route('/modules/:moduleId/resources')
  .get(learningController.getModuleResources)
  .post(
    restrictTo('Admin', 'Faculty'),
    upload.single('resource'),
    validateBody([
      'title',
      'resourceType'
    ]),
    learningController.addModuleResource
  );

// Resource routes
router.route('/resources/:id')
  .patch(
    restrictTo('Admin', 'Faculty'),
    upload.single('resource'),
    learningController.updateModuleResource
  )
  .delete(
    restrictTo('Admin', 'Faculty'),
    learningController.deleteModuleResource
  );

// Module quizzes routes
router.route('/modules/:moduleId/quizzes')
  .get(learningController.getModuleQuizzes)
  .post(
    restrictTo('Admin', 'Faculty'),
    validateBody([
      'title'
    ]),
    learningController.createQuiz
  );

// Quiz routes
router.route('/quizzes/:id')
  .patch(
    restrictTo('Admin', 'Faculty'),
    learningController.updateQuiz
  );

// Quiz questions routes
router.route('/quizzes/:quizId/questions')
  .get(
    restrictTo('Admin', 'Faculty'),
    learningController.getQuizQuestions
  )
  .post(
    restrictTo('Admin', 'Faculty'),
    upload.single('questionImage'),
    validateBody([
      'questionText',
      'questionType',
      'marks'
    ]),
    learningController.addQuizQuestion
  );

// Quiz attempt routes
router.post(
  '/quizzes/:quizId/attempt',
  restrictTo('Student'),
  learningController.startQuizAttempt
);

router.post(
  '/quiz-attempts/:attemptId/submit',
  restrictTo('Student'),
  validateBody([
    'answers'
  ]),
  learningController.submitQuizAnswers
);

router.get(
  '/quiz-attempts/:attemptId',
  learningController.getQuizAttemptDetails
);

// Quiz statistics route
router.get(
  '/quizzes/:quizId/statistics',
  restrictTo('Admin', 'Faculty'),
  learningController.getQuizStatistics
);

module.exports = router;