// controllers/learning.controller.js
const mongoose = require('mongoose');
const CourseModule = require('../models/CourseModule');
const ContentResource = require('../models/ContentResource');
const Quiz = require('../models/Quiz');
const QuizQuestion = require('../models/QuizQuestion');
const QuizAttempt = require('../models/QuizAttempt');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Course = require('../models/Course');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const fileService = require('../services/fileService');

/**
 * Get course modules
 * @route GET /api/learning/courses/:courseId/modules
 * @access Faculty, Student
 */
exports.getCourseModules = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;
  
  // Validate course
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError('Course not found', 404));
  }
  
  // Get modules
  const modules = await CourseModule.find({ course: courseId })
    .sort({ orderIndex: 1 });
  
  res.status(200).json({
    status: 'success',
    results: modules.length,
    data: {
      course,
      modules
    }
  });
});

/**
 * Create course module
 * @route POST /api/learning/courses/:courseId/modules
 * @access Faculty
 */
exports.createCourseModule = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;
  const { title, description, orderIndex, startDate, endDate, isVisible } = req.body;
  
  // Validate course
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError('Course not found', 404));
  }
  
  // Create module
  const module = await CourseModule.create({
    course: courseId,
    title,
    description,
    orderIndex: orderIndex || 1,
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
    isVisible: isVisible !== undefined ? isVisible : true,
    createdBy: req.user.id
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      module
    }
  });
});

/**
 * Update course module
 * @route PATCH /api/learning/modules/:id
 * @access Faculty
 */
exports.updateCourseModule = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { title, description, orderIndex, startDate, endDate, isVisible } = req.body;
  
  // Find module
  const module = await CourseModule.findById(id);
  if (!module) {
    return next(new AppError('Module not found', 404));
  }
  
  // Check if user is authorized (module creator or admin)
  if (module.createdBy.toString() !== req.user.id && !req.user.roles.includes('Admin')) {
    return next(new AppError('You are not authorized to update this module', 403));
  }
  
  // Update fields
  if (title !== undefined) module.title = title;
  if (description !== undefined) module.description = description;
  if (orderIndex !== undefined) module.orderIndex = orderIndex;
  if (startDate !== undefined) module.startDate = startDate ? new Date(startDate) : null;
  if (endDate !== undefined) module.endDate = endDate ? new Date(endDate) : null;
  if (isVisible !== undefined) module.isVisible = isVisible;
  
  // Save changes
  await module.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      module
    }
  });
});

/**
 * Delete course module
 * @route DELETE /api/learning/modules/:id
 * @access Faculty
 */
exports.deleteCourseModule = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  // Find module
  const module = await CourseModule.findById(id);
  if (!module) {
    return next(new AppError('Module not found', 404));
  }
  
  // Check if user is authorized (module creator or admin)
  if (module.createdBy.toString() !== req.user.id && !req.user.roles.includes('Admin')) {
    return next(new AppError('You are not authorized to delete this module', 403));
  }
  
  // Check if module has content resources
  const resourceCount = await ContentResource.countDocuments({ module: id });
  if (resourceCount > 0) {
    return next(new AppError('Cannot delete module with existing resources. Delete resources first.', 400));
  }
  
  // Check if module has quizzes
  const quizCount = await Quiz.countDocuments({ module: id });
  if (quizCount > 0) {
    return next(new AppError('Cannot delete module with existing quizzes. Delete quizzes first.', 400));
  }
  
  // Delete module
  await CourseModule.findByIdAndDelete(id);
  
  res.status(200).json({
    status: 'success',
    data: null
  });
});

/**
 * Get module resources
 * @route GET /api/learning/modules/:moduleId/resources
 * @access Faculty, Student
 */
exports.getModuleResources = catchAsync(async (req, res, next) => {
  const { moduleId } = req.params;
  
  // Validate module
  const module = await CourseModule.findById(moduleId);
  if (!module) {
    return next(new AppError('Module not found', 404));
  }
  
  // Get resources
  const resources = await ContentResource.find({ module: moduleId })
    .sort({ resourceType: 1, title: 1 });
  
  res.status(200).json({
    status: 'success',
    results: resources.length,
    data: {
      module,
      resources
    }
  });
});

/**
 * Add module resource
 * @route POST /api/learning/modules/:moduleId/resources
 * @access Faculty
 */
exports.addModuleResource = catchAsync(async (req, res, next) => {
  const { moduleId } = req.params;
  const { title, description, resourceType, externalUrl, isVisible } = req.body;
  
  // Validate module
  const module = await CourseModule.findById(moduleId);
  if (!module) {
    return next(new AppError('Module not found', 404));
  }
  
  // Process file upload if provided
  let resourceFile = null;
  if (req.file) {
    resourceFile = await fileService.uploadFile(req.file, 'learning/resources');
  } else if (!externalUrl) {
    return next(new AppError('Either file or external URL is required', 400));
  }
  
  // Create resource
  const resource = await ContentResource.create({
    module: moduleId,
    title,
    description,
    resourceType,
    resourceFile,
    externalUrl,
    isVisible: isVisible !== undefined ? isVisible : true,
    createdBy: req.user.id
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      resource
    }
  });
});

/**
 * Update module resource
 * @route PATCH /api/learning/resources/:id
 * @access Faculty
 */
exports.updateModuleResource = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { title, description, resourceType, externalUrl, isVisible } = req.body;
  
  // Find resource
  const resource = await ContentResource.findById(id);
  if (!resource) {
    return next(new AppError('Resource not found', 404));
  }
  
  // Check if user is authorized (resource creator or admin)
  if (resource.createdBy.toString() !== req.user.id && !req.user.roles.includes('Admin')) {
    return next(new AppError('You are not authorized to update this resource', 403));
  }
  
  // Process file upload if provided
  if (req.file) {
    // Delete old file if exists
    if (resource.resourceFile) {
      await fileService.deleteFile(resource.resourceFile);
    }
    
    resource.resourceFile = await fileService.uploadFile(req.file, 'learning/resources');
  }
  
  // Update fields
  if (title !== undefined) resource.title = title;
  if (description !== undefined) resource.description = description;
  if (resourceType !== undefined) resource.resourceType = resourceType;
  if (externalUrl !== undefined) resource.externalUrl = externalUrl;
  if (isVisible !== undefined) resource.isVisible = isVisible;
  
  // Save changes
  await resource.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      resource
    }
  });
});

/**
 * Delete module resource
 * @route DELETE /api/learning/resources/:id
 * @access Faculty
 */
exports.deleteModuleResource = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  // Find resource
  const resource = await ContentResource.findById(id);
  if (!resource) {
    return next(new AppError('Resource not found', 404));
  }
  
  // Check if user is authorized (resource creator or admin)
  if (resource.createdBy.toString() !== req.user.id && !req.user.roles.includes('Admin')) {
    return next(new AppError('You are not authorized to delete this resource', 403));
  }
  
  // Delete file if exists
  if (resource.resourceFile) {
    await fileService.deleteFile(resource.resourceFile);
  }
  
  // Delete resource
  await ContentResource.findByIdAndDelete(id);
  
  res.status(200).json({
    status: 'success',
    data: null
  });
});

/**
 * Get module quizzes
 * @route GET /api/learning/modules/:moduleId/quizzes
 * @access Faculty, Student
 */
exports.getModuleQuizzes = catchAsync(async (req, res, next) => {
  const { moduleId } = req.params;
  
  // Validate module
  const module = await CourseModule.findById(moduleId);
  if (!module) {
    return next(new AppError('Module not found', 404));
  }
  
  // Get quizzes
  const quizzes = await Quiz.find({ module: moduleId })
    .sort({ startDatetime: 1 });
  
  res.status(200).json({
    status: 'success',
    results: quizzes.length,
    data: {
      module,
      quizzes
    }
  });
});

/**
 * Create quiz
 * @route POST /api/learning/modules/:moduleId/quizzes
 * @access Faculty
 */
exports.createQuiz = catchAsync(async (req, res, next) => {
  const { moduleId } = req.params;
  const {
    title,
    description,
    instructions,
    startDatetime,
    endDatetime,
    timeLimit,
    totalMarks,
    passingPercentage,
    shuffleQuestions,
    showResultsAfter,
    status
  } = req.body;
  
  // Validate module
  const module = await CourseModule.findById(moduleId);
  if (!module) {
    return next(new AppError('Module not found', 404));
  }
  
  // Create quiz
  const quiz = await Quiz.create({
    module: moduleId,
    title,
    description,
    instructions,
    startDatetime: startDatetime ? new Date(startDatetime) : null,
    endDatetime: endDatetime ? new Date(endDatetime) : null,
    timeLimit: parseInt(timeLimit) || 60,
    totalMarks: parseInt(totalMarks) || 100,
    passingPercentage: parseInt(passingPercentage) || 35,
    shuffleQuestions: shuffleQuestions === 'true' || shuffleQuestions === true,
    showResultsAfter: showResultsAfter || 'immediately',
    status: status || 'draft'
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      quiz
    }
  });
});

/**
 * Update quiz
 * @route PATCH /api/learning/quizzes/:id
 * @access Faculty
 */
exports.updateQuiz = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const {
    title,
    description,
    instructions,
    startDatetime,
    endDatetime,
    timeLimit,
    totalMarks,
    passingPercentage,
    shuffleQuestions,
    showResultsAfter,
    status
  } = req.body;
  
  // Find quiz
  const quiz = await Quiz.findById(id);
  if (!quiz) {
    return next(new AppError('Quiz not found', 404));
  }
  
  // Update fields
  if (title !== undefined) quiz.title = title;
  if (description !== undefined) quiz.description = description;
  if (instructions !== undefined) quiz.instructions = instructions;
  if (startDatetime !== undefined) quiz.startDatetime = startDatetime ? new Date(startDatetime) : null;
  if (endDatetime !== undefined) quiz.endDatetime = endDatetime ? new Date(endDatetime) : null;
  if (timeLimit !== undefined) quiz.timeLimit = parseInt(timeLimit);
  if (totalMarks !== undefined) quiz.totalMarks = parseInt(totalMarks);
  if (passingPercentage !== undefined) quiz.passingPercentage = parseInt(passingPercentage);
  if (shuffleQuestions !== undefined) quiz.shuffleQuestions = shuffleQuestions === 'true' || shuffleQuestions === true;
  if (showResultsAfter !== undefined) quiz.showResultsAfter = showResultsAfter;
  if (status !== undefined) quiz.status = status;
  
  // Save changes
  await quiz.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      quiz
    }
  });
});

/**
 * Add quiz question
 * @route POST /api/learning/quizzes/:quizId/questions
 * @access Faculty
 */
exports.addQuizQuestion = catchAsync(async (req, res, next) => {
  const { quizId } = req.params;
  const {
    questionText,
    questionType,
    correctAnswer,
    explanation,
    marks,
    difficulty,
    orderIndex,
    options
  } = req.body;
  
  // Validate quiz
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    return next(new AppError('Quiz not found', 404));
  }
  
  // Process image if provided
  let imageAttachment = null;
  if (req.file) {
    imageAttachment = await fileService.uploadFile(req.file, 'learning/quiz-questions');
  }
  
  // Parse options if provided as string
  let parsedOptions = options;
  if (options && typeof options === 'string') {
    try {
      parsedOptions = JSON.parse(options);
    } catch (e) {
      parsedOptions = [];
    }
  }
  
  // Create question
  const question = await QuizQuestion.create({
    quiz: quizId,
    questionText,
    questionType,
    imageAttachment,
    correctAnswer,
    explanation,
    marks: parseInt(marks) || 1,
    difficulty: difficulty || 'medium',
    orderIndex: parseInt(orderIndex) || 0,
    options: parsedOptions || []
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      question
    }
  });
});

/**
 * Get quiz questions
 * @route GET /api/learning/quizzes/:quizId/questions
 * @access Faculty
 */
exports.getQuizQuestions = catchAsync(async (req, res, next) => {
  const { quizId } = req.params;
  
  // Validate quiz
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    return next(new AppError('Quiz not found', 404));
  }
  
  // Get questions
  const questions = await QuizQuestion.find({ quiz: quizId })
    .sort({ orderIndex: 1 });
  
  res.status(200).json({
    status: 'success',
    results: questions.length,
    data: {
      quiz,
      questions
    }
  });
});

/**
 * Start quiz attempt
 * @route POST /api/learning/quizzes/:quizId/attempt
 * @access Student
 */
exports.startQuizAttempt = catchAsync(async (req, res, next) => {
  const { quizId } = req.params;
  
  // Get student ID from user
  const student = await Student.findOne({ user: req.user.id });
  if (!student) {
    return next(new AppError('Student not found', 404));
  }
  
  // Validate quiz
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    return next(new AppError('Quiz not found', 404));
  }
  
  // Check if quiz is available
  const now = new Date();
  if (quiz.startDatetime && quiz.startDatetime > now) {
    return next(new AppError('Quiz has not started yet', 400));
  }
  if (quiz.endDatetime && quiz.endDatetime < now) {
    return next(new AppError('Quiz has ended', 400));
  }
  if (quiz.status !== 'published') {
    return next(new AppError('Quiz is not available', 400));
  }
  
  // Check if student already has an attempt
  const existingAttempt = await QuizAttempt.findOne({
    quiz: quizId,
    student: student._id,
    isCompleted: false
  });
  
  if (existingAttempt) {
    return next(new AppError('You already have an ongoing attempt for this quiz', 400));
  }
  
  // Create quiz attempt
  const attempt = await QuizAttempt.create({
    quiz: quizId,
    student: student._id,
    startTime: now,
    isCompleted: false
  });
  
  // Get quiz questions (shuffle if needed)
  let questions = await QuizQuestion.find({ quiz: quizId });
  
  if (quiz.shuffleQuestions) {
    questions = questions.sort(() => Math.random() - 0.5);
  } else {
    questions = questions.sort((a, b) => a.orderIndex - b.orderIndex);
  }
  
  // For student view, remove correctAnswer from questions
  const questionsForStudent = questions.map(q => ({
    id: q._id,
    questionText: q.questionText,
    questionType: q.questionType,
    imageAttachment: q.imageAttachment,
    marks: q.marks,
    options: q.options.map(opt => ({
      id: opt._id,
      optionText: opt.optionText,
      orderIndex: opt.orderIndex
    })).sort((a, b) => a.orderIndex - b.orderIndex)
  }));
  
  res.status(201).json({
    status: 'success',
    data: {
      attempt: {
        id: attempt._id,
        startTime: attempt.startTime,
        quiz: {
          id: quiz._id,
          title: quiz.title,
          description: quiz.description,
          instructions: quiz.instructions,
          timeLimit: quiz.timeLimit,
          totalMarks: quiz.totalMarks
        },
        questions: questionsForStudent
      }
    }
  });
});

/**
 * Submit quiz answers
 * @route POST /api/learning/quiz-attempts/:attemptId/submit
 * @access Student
 */
exports.submitQuizAnswers = catchAsync(async (req, res, next) => {
  const { attemptId } = req.params;
  const { answers } = req.body;
  
  // Validate attempt
  const attempt = await QuizAttempt.findById(attemptId);
  if (!attempt) {
    return next(new AppError('Quiz attempt not found', 404));
  }
  
  // Check if attempt belongs to the current user
  const student = await Student.findOne({ user: req.user.id });
  if (!student || student._id.toString() !== attempt.student.toString()) {
    return next(new AppError('Unauthorized to submit this attempt', 403));
  }
  
  // Check if attempt is already completed
  if (attempt.isCompleted) {
    return next(new AppError('Quiz attempt is already completed', 400));
  }
  
  // Validate and process answers
  if (!answers || !Array.isArray(answers)) {
    return next(new AppError('Answers must be provided as an array', 400));
  }
  
  // Process each answer
  const processedAnswers = [];
  let totalMarksObtained = 0;
  
  for (const ans of answers) {
    // Find question
    const question = await QuizQuestion.findById(ans.question);
    if (!question) {
      continue; // Skip invalid questions
    }
    
    // Check if answer is correct
    let isCorrect = false;
    
    if (question.questionType === 'multipleChoice') {
      isCorrect = ans.selectedOption === question.correctAnswer;
    } else if (question.questionType === 'trueFalse') {
      isCorrect = ans.answerText === question.correctAnswer;
    } else if (question.questionType === 'shortAnswer' || question.questionType === 'essay') {
      // These require manual grading, mark as not graded yet
      isCorrect = false;
    }
    
    // Calculate marks
    const marksAwarded = isCorrect ? question.marks : 0;
    totalMarksObtained += marksAwarded;
    
    // Add to processed answers
    processedAnswers.push({
      question: question._id,
      answerText: ans.answerText,
      selectedOption: ans.selectedOption,
      isCorrect,
      marksAwarded
    });
  }
  
  // Update attempt
  attempt.answers = processedAnswers;
  attempt.endTime = new Date();
  attempt.isCompleted = true;
  attempt.totalMarksObtained = totalMarksObtained;
  
  // Calculate time taken
  const timeTakenMs = attempt.endTime - attempt.startTime;
  attempt.timeTaken = Math.floor(timeTakenMs / 1000); // Convert to seconds
  
  // Calculate percentage score
  const quiz = await Quiz.findById(attempt.quiz);
  if (quiz && quiz.totalMarks > 0) {
    attempt.percentageScore = (totalMarksObtained / quiz.totalMarks) * 100;
    attempt.passed = attempt.percentageScore >= quiz.passingPercentage;
  }
  
  await attempt.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      attempt: {
        id: attempt._id,
        totalMarksObtained,
        percentageScore: attempt.percentageScore,
        passed: attempt.passed,
        timeTaken: attempt.timeTaken
      }
    }
  });
});

/**
 * Get quiz attempt details
 * @route GET /api/learning/quiz-attempts/:attemptId
 * @access Faculty, Student (own attempt)
 */
exports.getQuizAttemptDetails = catchAsync(async (req, res, next) => {
  const { attemptId } = req.params;
  
  // Get attempt with populated fields
  const attempt = await QuizAttempt.findById(attemptId)
    .populate('quiz', 'title description instructions totalMarks passingPercentage showResultsAfter')
    .populate('student', 'name admissionNo')
    .populate('answers.question');
  
  if (!attempt) {
    return next(new AppError('Quiz attempt not found', 404));
  }
  
  // Check permissions
  const student = await Student.findOne({ user: req.user.id });
  const faculty = await Faculty.findOne({ user: req.user.id });
  
  const isStudent = student && student._id.toString() === attempt.student._id.toString();
  const isFaculty = faculty !== null;
  const isAdmin = req.user.roles.includes('Admin');
  
  if (!isStudent && !isFaculty && !isAdmin) {
    return next(new AppError('Unauthorized to view this attempt', 403));
  }
  
  // For student, check if results should be shown based on quiz settings
  if (isStudent) {
    const quiz = await Quiz.findById(attempt.quiz);
    
    if (quiz.showResultsAfter === 'manually' && !isAdmin) {
      // Only show submission status, not answers or score
      return res.status(200).json({
        status: 'success',
        data: {
          attempt: {
            id: attempt._id,
            quiz: {
              id: quiz._id,
              title: quiz.title
            },
            student: {
              id: attempt.student._id,
              name: attempt.student.name,
              admissionNo: attempt.student.admissionNo
            },
            startTime: attempt.startTime,
            endTime: attempt.endTime,
            isCompleted: attempt.isCompleted,
            message: 'Results will be available after review by faculty'
          }
        }
      });
    } else if (quiz.showResultsAfter === 'after_due_date') {
      if (quiz.endDatetime > new Date() && !isAdmin) {
        // Quiz hasn't ended, only show submission status
        return res.status(200).json({
          status: 'success',
          data: {
            attempt: {
              id: attempt._id,
              quiz: {
                id: quiz._id,
                title: quiz.title
              },
              student: {
                id: attempt.student._id,
                name: attempt.student.name,
                admissionNo: attempt.student.admissionNo
              },
              startTime: attempt.startTime,
              endTime: attempt.endTime,
              isCompleted: attempt.isCompleted,
              message: 'Results will be available after the quiz due date'
            }
          }
        });
      }
    }
  }
  
  // Prepare response with detailed information
  res.status(200).json({
    status: 'success',
    data: {
      attempt: {
        id: attempt._id,
        quiz: {
          id: attempt.quiz._id,
          title: attempt.quiz.title,
          description: attempt.quiz.description,
          instructions: attempt.quiz.instructions,
          totalMarks: attempt.quiz.totalMarks,
          passingPercentage: attempt.quiz.passingPercentage
        },
        student: {
          id: attempt.student._id,
          name: attempt.student.name,
          admissionNo: attempt.student.admissionNo
        },
        startTime: attempt.startTime,
        endTime: attempt.endTime,
        timeTaken: attempt.timeTaken,
        isCompleted: attempt.isCompleted,
        totalMarksObtained: attempt.totalMarksObtained,
        percentageScore: attempt.percentageScore,
        passed: attempt.passed,
        answers: attempt.answers.map(ans => ({
          question: {
            id: ans.question._id,
            questionText: ans.question.questionText,
            questionType: ans.question.questionType,
            explanation: ans.question.explanation,
            correctAnswer: ans.question.correctAnswer,
            marks: ans.question.marks
          },
          answerText: ans.answerText,
          selectedOption: ans.selectedOption,
          isCorrect: ans.isCorrect,
          marksAwarded: ans.marksAwarded
        }))
      }
    }
  });
});

/**
 * Get quiz statistics
 * @route GET /api/learning/quizzes/:quizId/statistics
 * @access Faculty
 */
exports.getQuizStatistics = catchAsync(async (req, res, next) => {
  const { quizId } = req.params;
  
  // Validate quiz
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    return next(new AppError('Quiz not found', 404));
  }
  
  // Get all attempts for this quiz
  const attempts = await QuizAttempt.find({ 
    quiz: quizId,
    isCompleted: true
  }).populate('student', 'name admissionNo');
  
  // Calculate statistics
  const totalAttempts = attempts.length;
  const totalPassed = attempts.filter(a => a.passed).length;
  const passRate = totalAttempts > 0 ? (totalPassed / totalAttempts) * 100 : 0;
  
  // Calculate average score
  const totalScore = attempts.reduce((sum, a) => sum + a.percentageScore, 0);
  const averageScore = totalAttempts > 0 ? totalScore / totalAttempts : 0;
  
  // Get highest and lowest scores
  const scores = attempts.map(a => ({
    student: {
      id: a.student._id,
      name: a.student.name,
      admissionNo: a.student.admissionNo
    },
    score: a.percentageScore,
    timeTaken: a.timeTaken
  }));
  
  const sortedScores = [...scores].sort((a, b) => b.score - a.score);
  const highestScore = sortedScores.length > 0 ? sortedScores[0] : null;
  const lowestScore = sortedScores.length > 0 ? sortedScores[sortedScores.length - 1] : null;
  
  // Question statistics (percentage correct for each question)
  const questionStats = [];
  const questions = await QuizQuestion.find({ quiz: quizId });
  
  for (const question of questions) {
    const questionAttempts = attempts.flatMap(a => 
      a.answers.filter(ans => ans.question.toString() === question._id.toString())
    );
    
    const totalQuestionAttempts = questionAttempts.length;
    const correctAttempts = questionAttempts.filter(a => a.isCorrect).length;
    const correctPercentage = totalQuestionAttempts > 0 
      ? (correctAttempts / totalQuestionAttempts) * 100 
      : 0;
    
    questionStats.push({
      question: {
        id: question._id,
        questionText: question.questionText,
        questionType: question.questionType,
        marks: question.marks
      },
      totalAttempts: totalQuestionAttempts,
      correctAttempts,
      correctPercentage
    });
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      quiz: {
        id: quiz._id,
        title: quiz.title
      },
      statistics: {
        totalAttempts,
        totalPassed,
        passRate,
        averageScore,
        highestScore,
        lowestScore,
        questionStats
      },
      attempts: attempts.map(a => ({
        id: a._id,
        student: {
          id: a.student._id,
          name: a.student.name,
          admissionNo: a.student.admissionNo
        },
        startTime: a.startTime,
        endTime: a.endTime,
        timeTaken: a.timeTaken,
        totalMarksObtained: a.totalMarksObtained,
        percentageScore: a.percentageScore,
        passed: a.passed
      }))
    }
  });
});

module.exports = exports;