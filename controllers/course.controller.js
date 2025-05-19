// controllers/course.controller.js
const Course = require('../models/Course');
const CourseType = require('../models/CourseType');
const CourseSection = require('../models/CourseSection');
const ElectiveGroup = require('../models/ElectiveGroup');
const ElectiveGroupCourse = require('../models/ElectiveGroupCourse');
const ElectiveCourseSection = require('../models/ElectiveCourseSection');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const fileService = require('../services/fileService');

// Create course
exports.createCourse = catchAsync(async (req, res, next) => {
  const {
    courseCode,
    name,
    semester,
    branch,
    regulation,
    courseType,
    credits,
    description,
    objectives,
    outcomes,
    prerequisites
  } = req.body;
  
  // Check if course code already exists
  const existingCourse = await Course.findOne({ courseCode });
  if (existingCourse) {
    return next(new AppError('Course with this code already exists', 400));
  }
  
  // Handle syllabus upload
  let syllabus;
  if (req.files && req.files.syllabus) {
    syllabus = await fileService.uploadFile(req.files.syllabus, 'courses/syllabus');
  }
  
  // Create course
  const course = await Course.create({
    courseCode,
    name,
    semester,
    branch,
    regulation,
    courseType,
    credits,
    syllabus,
    description,
    objectives,
    outcomes,
    prerequisites,
    status: 'active'
  });
  
  // Populate references for response
  await course
    .populate('semester', 'name')
    .populate('branch', 'name code')
    .populate('regulation', 'name code')
    .populate('courseType', 'name');
  
  res.status(201).json({
    status: 'success',
    data: {
      course
    }
  });
});

// Get courses
exports.getCourses = catchAsync(async (req, res, next) => {
  const { semester, branch, regulation, courseType, status, search } = req.query;
  
  // Build query
  const query = {};
  
  if (semester) query.semester = semester;
  if (branch) query.branch = branch;
  if (regulation) query.regulation = regulation;
  if (courseType) query.courseType = courseType;
  if (status) query.status = status;
  
  // Search by code or name
  if (search) {
    query.$or = [
      { courseCode: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } }
    ];
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  
  // Execute query
  const [courses, total] = await Promise.all([
    Course.find(query)
      .populate('semester', 'name')
      .populate('branch', 'name code')
      .populate('regulation', 'name code')
      .populate('courseType', 'name')
      .sort({ courseCode: 1 })
      .skip(skip)
      .limit(limit),
    Course.countDocuments(query)
  ]);
  
  res.status(200).json({
    status: 'success',
    results: courses.length,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    },
    data: {
      courses
    }
  });
});

// Get course by ID
exports.getCourseById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const course = await Course.findById(id)
    .populate('semester', 'name')
    .populate('branch', 'name code')
    .populate('regulation', 'name code')
    .populate('courseType', 'name');
  
  if (!course) {
    return next(new AppError('Course not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      course
    }
  });
});

// Update course
exports.updateCourse = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const {
    name,
    semester,
    branch,
    regulation,
    courseType,
    credits,
    description,
    objectives,
    outcomes,
    prerequisites,
    status
  } = req.body;
  
  // Find the course
  const course = await Course.findById(id);
  
  if (!course) {
    return next(new AppError('Course not found', 404));
  }
  
  // Update fields
  if (name) course.name = name;
  if (semester) course.semester = semester;
  if (branch) course.branch = branch;
  if (regulation) course.regulation = regulation;
  if (courseType) course.courseType = courseType;
  if (credits) course.credits = credits;
  if (description) course.description = description;
  if (objectives) course.objectives = objectives;
  if (outcomes) course.outcomes = outcomes;
  if (prerequisites) course.prerequisites = prerequisites;
  if (status) course.status = status;
  
  // Handle syllabus upload
  if (req.files && req.files.syllabus) {
    // Delete old syllabus if exists
    if (course.syllabus) {
      await fileService.deleteFile(course.syllabus);
    }
    
    course.syllabus = await fileService.uploadFile(req.files.syllabus, 'courses/syllabus');
  }
  
  // Save changes
  await course.save();
  
  // Populate references for response
  await course
    .populate('semester', 'name')
    .populate('branch', 'name code')
    .populate('regulation', 'name code')
    .populate('courseType', 'name');
  
  res.status(200).json({
    status: 'success',
    data: {
      course
    }
  });
});

// Delete course
exports.deleteCourse = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const course = await Course.findById(id);
  
  if (!course) {
    return next(new AppError('Course not found', 404));
  }
  
  // Check if course has sections
  const sectionsCount = await CourseSection.countDocuments({ course: id });
  
  if (sectionsCount > 0) {
    return next(new AppError('Cannot delete course with existing sections', 400));
  }
  
  // Delete syllabus if exists
  if (course.syllabus) {
    await fileService.deleteFile(course.syllabus);
  }
  
  // Delete the course
  await Course.findByIdAndDelete(id);
  
  res.status(200).json({
    status: 'success',
    message: 'Course deleted successfully',
    data: null
  });
});

// Create course section
exports.createCourseSection = catchAsync(async (req, res, next) => {
  const {
    course,
    sectionName,
    sectionType,
    capacity,
    room,
    description
  } = req.body;
  
  // Check if course exists
  const courseExists = await Course.findById(course);
  if (!courseExists) {
    return next(new AppError('Course not found', 404));
  }
  
  // Check if section name already exists for this course
  const existingSection = await CourseSection.findOne({
    course,
    sectionName
  });
  
  if (existingSection) {
    return next(new AppError('Section with this name already exists for this course', 400));
  }
  
  // Create section
  const section = await CourseSection.create({
    course,
    sectionName,
    sectionType,
    capacity,
    room,
    description,
    isActive: true
  });
  
  // Populate references for response
  await section
    .populate('course', 'name courseCode')
    .populate('room', 'roomNumber building');
  
  res.status(201).json({
    status: 'success',
    data: {
      section
    }
  });
});

// Get course sections
exports.getCourseSections = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;
  
  // Get sections
  const sections = await CourseSection.find({ course: courseId })
    .populate('room', 'roomNumber building')
    .sort({ sectionName: 1 });
  
  res.status(200).json({
    status: 'success',
    results: sections.length,
    data: {
      sections
    }
  });
});

// Update course section
exports.updateCourseSection = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const {
    sectionName,
    sectionType,
    capacity,
    room,
    description,
    isActive
  } = req.body;
  
  // Find the section
  const section = await CourseSection.findById(id);
  
  if (!section) {
    return next(new AppError('Section not found', 404));
  }
  
  // Update fields
  if (sectionName) {
    // Check if name already exists
    const existingSection = await CourseSection.findOne({
      _id: { $ne: id },
      course: section.course,
      sectionName
    });
    
    if (existingSection) {
      return next(new AppError('Section with this name already exists for this course', 400));
    }
    
    section.sectionName = sectionName;
  }
  
  if (sectionType) section.sectionType = sectionType;
  if (capacity) section.capacity = capacity;
  if (room) section.room = room;
  if (description) section.description = description;
  if (isActive !== undefined) section.isActive = isActive;
  
  // Save changes
  await section.save();
  
  // Populate references for response
  await section
    .populate('course', 'name courseCode')
    .populate('room', 'roomNumber building');
  
  res.status(200).json({
    status: 'success',
    data: {
      section
    }
  });
});

// Delete course section
exports.deleteCourseSection = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const section = await CourseSection.findByIdAndDelete(id);
  
  if (!section) {
    return next(new AppError('Section not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Section deleted successfully',
    data: null
  });
});

// Create elective group
exports.createElectiveGroup = catchAsync(async (req, res, next) => {
  const {
    name,
    semester,
    electiveType,
    minCredits,
    maxCourses,
    description,
    minStudents,
    maxStudents,
    isCrossDepartment,
    registrationPriority
  } = req.body;
  
  // Create elective group
  const electiveGroup = await ElectiveGroup.create({
    name,
    semester,
    electiveType,
    minCredits: minCredits || 0,
    maxCourses: maxCourses || 1,
    description,
    minStudents,
    maxStudents,
    isCrossDepartment: isCrossDepartment || false,
    registrationPriority: registrationPriority || 'first_come'
  });
  
  // Populate references for response
  await electiveGroup.populate('semester', 'name');
  
  res.status(201).json({
    status: 'success',
    data: {
      electiveGroup
    }
  });
});

// Get elective groups
exports.getElectiveGroups = catchAsync(async (req, res, next) => {
  const { semester, electiveType } = req.query;
  
  // Build query
  const query = {};
  
  if (semester) query.semester = semester;
  if (electiveType) query.electiveType = electiveType;
  
  // Execute query
  const electiveGroups = await ElectiveGroup.find(query)
    .populate('semester', 'name')
    .sort({ name: 1 });
  
  res.status(200).json({
    status: 'success',
    results: electiveGroups.length,
    data: {
      electiveGroups
    }
  });
});

// Add course to elective group
exports.addCourseToElectiveGroup = catchAsync(async (req, res, next) => {
  const { electiveGroupId } = req.params;
  const { courseId, sectionId, quota } = req.body;
  
  // Check if elective group exists
  const electiveGroup = await ElectiveGroup.findById(electiveGroupId);
  if (!electiveGroup) {
    return next(new AppError('Elective group not found', 404));
  }
  
  // Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError('Course not found', 404));
  }
  
  // Check if section exists
  const section = await CourseSection.findById(sectionId);
  if (!section) {
    return next(new AppError('Section not found', 404));
  }
  
  // Check if course already in elective group
  const existingElectiveCourse = await ElectiveGroupCourse.findOne({
    electiveGroup: electiveGroupId,
    course: courseId
  });
  
  if (!existingElectiveCourse) {
    // Add course to elective group
    await ElectiveGroupCourse.create({
      electiveGroup: electiveGroupId,
      course: courseId
    });
  }
  
  // Check if course-section already exists
  const existingElectiveSection = await ElectiveCourseSection.findOne({
    electiveGroup: electiveGroupId,
    course: courseId,
    section: sectionId
  });
  
  if (existingElectiveSection) {
    return next(new AppError('This section is already in the elective group', 400));
  }
  
  // Add course-section to elective group
  const electiveSection = await ElectiveCourseSection.create({
    electiveGroup: electiveGroupId,
    course: courseId,
    section: sectionId,
    quota: quota || section.capacity,
    filled: 0
  });
  
  // Populate references for response
  await electiveSection
    .populate('course', 'name courseCode')
    .populate('section', 'sectionName');
  
  res.status(201).json({
    status: 'success',
    data: {
      electiveSection
    }
  });
});

// Get elective group courses
exports.getElectiveGroupCourses = catchAsync(async (req, res, next) => {
  const { electiveGroupId } = req.params;
  
  // Find courses in the elective group
  const electiveCourses = await ElectiveGroupCourse.find({
    electiveGroup: electiveGroupId
  }).populate('course', 'name courseCode credits description');
  
  // Find course-sections in the elective group
  const electiveSections = await ElectiveCourseSection.find({
    electiveGroup: electiveGroupId
  })
    .populate('course', 'name courseCode')
    .populate('section', 'sectionName capacity');
  
  // Group sections by course
  const groupedSections = {};
  
  electiveSections.forEach(section => {
    const courseId = section.course._id.toString();
    if (!groupedSections[courseId]) {
      groupedSections[courseId] = [];
    }
    groupedSections[courseId].push(section);
  });
  
  // Format response data
  const courses = electiveCourses.map(ec => {
    const courseId = ec.course._id.toString();
    return {
      id: ec.course._id,
      name: ec.course.name,
      courseCode: ec.course.courseCode,
      credits: ec.course.credits,
      description: ec.course.description,
      sections: groupedSections[courseId] || []
    };
  });
  
  res.status(200).json({
    status: 'success',
    results: courses.length,
    data: {
      courses
    }
  });
});

// Remove course from elective group
exports.removeCourseFromElectiveGroup = catchAsync(async (req, res, next) => {
  const { electiveGroupId, courseId } = req.params;
  
  // Remove course from elective group
  const result = await ElectiveGroupCourse.findOneAndDelete({
    electiveGroup: electiveGroupId,
    course: courseId
  });
  
  if (!result) {
    return next(new AppError('Course not found in elective group', 404));
  }
  
  // Remove all sections of this course from elective group
  await ElectiveCourseSection.deleteMany({
    electiveGroup: electiveGroupId,
    course: courseId
  });
  
  res.status(200).json({
    status: 'success',
    message: 'Course removed from elective group successfully',
    data: null
  });
});