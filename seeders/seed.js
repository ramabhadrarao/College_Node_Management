// seeders/seed.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const logger = require('../utils/logger');

// Import models
const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const ResourceType = require('../models/ResourceType');
const Department = require('../models/Department');
const Program = require('../models/Program');
const Branch = require('../models/Branch');
const AcademicYear = require('../models/AcademicYear');
const Semester = require('../models/Semester');
const Regulation = require('../models/Regulation');
const CourseType = require('../models/CourseType');
const NotificationTemplate = require('../models/NotificationTemplate');
const SystemSetting = require('../models/SystemSetting');

// Connect to MongoDB
mongoose
  .connect(config.db.uri, config.db.options)
  .then(() => {
    logger.info('MongoDB connected successfully for seeding');
    runSeed();
  })
  .catch((err) => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

/**
 * Main seed function
 */
async function runSeed() {
  try {
    logger.info('Starting database seeding...');

    // Create required directories
    createRequiredDirectories();

    // Clear existing data
    // Uncomment if you want to clear the database before seeding
    // await clearDatabase();

    // Seed data in order
    await seedRoles();
    await seedPermissions();
    await seedResourceTypes();
    await seedUsers();
    await seedDepartments();
    await seedPrograms();
    await seedBranches();
    await seedAcademicYears();
    await seedSemesters();
    await seedRegulations();
    await seedCourseTypes();
    await seedNotificationTemplates();
    await seedSystemSettings();

    logger.info('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  }
}

/**
 * Create required directories
 */
function createRequiredDirectories() {
  const directories = [
    path.join(process.cwd(), 'uploads'),
    path.join(process.cwd(), 'uploads/faculty'),
    path.join(process.cwd(), 'uploads/faculty/photo'),
    path.join(process.cwd(), 'uploads/faculty/documents'),
    path.join(process.cwd(), 'uploads/faculty/publication'),
    path.join(process.cwd(), 'uploads/faculty/workshop'),
    path.join(process.cwd(), 'uploads/faculty/qualification'),
    path.join(process.cwd(), 'uploads/faculty/experience'),
    path.join(process.cwd(), 'uploads/students'),
    path.join(process.cwd(), 'uploads/students/photo'),
    path.join(process.cwd(), 'uploads/students/documents'),
    path.join(process.cwd(), 'logs'),
    path.join(process.cwd(), 'backups'),
    path.join(process.cwd(), 'templates'),
    path.join(process.cwd(), 'templates/emails')
  ];

  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created directory: ${dir}`);
    }
  }

  // Create email templates if they don't exist
  createEmailTemplates();
}

/**
 * Create email templates
 */
function createEmailTemplates() {
  const emailTemplates = [
    {
      name: 'welcome',
      content: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .content { padding: 20px; background-color: #f9f9f9; border-radius: 5px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Welcome to College Management System</h2>
    </div>
    <div class="content">
      <p>Dear {{name}},</p>
      <p>Welcome to the College Management System! Your account has been created successfully.</p>
      <p>Here are your login credentials:</p>
      <p><strong>Username:</strong> {{username}}</p>
      <p><strong>Password:</strong> {{password}}</p>
      <p>Please login at <a href="{{loginUrl}}">{{loginUrl}}</a> and change your password upon first login.</p>
      <p>If you have any questions, please contact our support team.</p>
      <p>Best regards,<br>College Management System Team</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply to this message.</p>
      <p>Contact: {{supportEmail}}</p>
    </div>
  </div>
</body>
</html>`
    },
    {
      name: 'password-reset',
      content: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .content { padding: 20px; background-color: #f9f9f9; border-radius: 5px; }
    .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 3px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Password Reset Request</h2>
    </div>
    <div class="content">
      <p>Dear {{name}},</p>
      <p>We received a request to reset your password. Click the button below to reset your password:</p>
      <p style="text-align: center;">
        <a href="{{resetUrl}}" class="button">Reset Password</a>
      </p>
      <p>Or copy and paste this URL into your browser: <a href="{{resetUrl}}">{{resetUrl}}</a></p>
      <p>This link will expire in {{expiryTime}}.</p>
      <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
      <p>Best regards,<br>College Management System Team</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply to this message.</p>
      <p>Contact: {{supportEmail}}</p>
    </div>
  </div>
</body>
</html>`
    },
    {
      name: 'notification',
      content: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .content { padding: 20px; background-color: #f9f9f9; border-radius: 5px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Notification</h2>
    </div>
    <div class="content">
      <p>Dear {{name}},</p>
      <p>{{message}}</p>
      <p>Best regards,<br>College Management System Team</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply to this message.</p>
      <p>Contact: {{supportEmail}}</p>
    </div>
  </div>
</body>
</html>`
    },
    {
      name: 'status-update',
      content: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .content { padding: 20px; background-color: #f9f9f9; border-radius: 5px; }
    .status { font-weight: bold; color: #007bff; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Status Update Notification</h2>
    </div>
    <div class="content">
      <p>Dear {{name}},</p>
      <p>Your profile status has been updated to <span class="status">{{status}}</span>.</p>
      <p><strong>Reason:</strong> {{reason}}</p>
      <p>If you have any questions, please contact the administration.</p>
      <p>Best regards,<br>College Management System Team</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply to this message.</p>
    </div>
  </div>
</body>
</html>`
    }
  ];

  const templatesDir = path.join(process.cwd(), 'templates/emails');

  for (const template of emailTemplates) {
    const templatePath = path.join(templatesDir, `${template.name}.hbs`);
    if (!fs.existsSync(templatePath)) {
      fs.writeFileSync(templatePath, template.content);
      logger.info(`Created email template: ${template.name}`);
    }
  }
}

/**
 * Clear existing data
 */
async function clearDatabase() {
  logger.info('Clearing existing data...');
  
  const models = [
    User, Role, Permission, ResourceType, Department, Program, 
    Branch, AcademicYear, Semester, Regulation, CourseType,
    NotificationTemplate, SystemSetting
  ];
  
  for (const model of models) {
    await model.deleteMany({});
  }
  
  logger.info('Existing data cleared');
}

/**
 * Seed roles
 */
async function seedRoles() {
  logger.info('Seeding roles...');
  
  const roles = [
    { name: 'Admin', description: 'System administrator with full access', isSystemRole: true },
    { name: 'Faculty', description: 'Faculty member', isSystemRole: true },
    { name: 'HOD', description: 'Head of Department', isSystemRole: true },
    { name: 'Student', description: 'Student', isSystemRole: true },
    { name: 'Staff', description: 'Non-teaching staff', isSystemRole: true }
  ];
  
  for (const role of roles) {
    await Role.findOneAndUpdate(
      { name: role.name },
      role,
      { upsert: true, new: true }
    );
  }
  
  logger.info(`${roles.length} roles seeded`);
}

/**
 * Seed permissions
 */
async function seedPermissions() {
  logger.info('Seeding permissions...');
  
  const permissions = [
    // User management
    { name: 'user_create', description: 'Create new users', module: 'UserManagement' },
    { name: 'user_view', description: 'View user details', module: 'UserManagement' },
    { name: 'user_edit', description: 'Edit user details', module: 'UserManagement' },
    { name: 'user_delete', description: 'Delete users', module: 'UserManagement' },
    
    // Profile management
    { name: 'profile_view_own', description: 'View own profile', module: 'ProfileManagement' },
    { name: 'profile_edit_own', description: 'Edit own profile', module: 'ProfileManagement' },
    { name: 'profile_view', description: 'View any profile', module: 'ProfileManagement' },
    { name: 'profile_edit', description: 'Edit any profile', module: 'ProfileManagement' },
    
    // Faculty management
    { name: 'faculty_create', description: 'Create faculty profiles', module: 'FacultyManagement' },
    { name: 'faculty_view', description: 'View faculty profiles', module: 'FacultyManagement' },
    { name: 'faculty_edit', description: 'Edit faculty profiles', module: 'FacultyManagement' },
    { name: 'faculty_approve', description: 'Approve faculty profiles', module: 'FacultyManagement' },
    
    // Student management
    { name: 'student_create', description: 'Create student profiles', module: 'StudentManagement' },
    { name: 'student_view', description: 'View student profiles', module: 'StudentManagement' },
    { name: 'student_edit', description: 'Edit student profiles', module: 'StudentManagement' },
    { name: 'student_bulk_import', description: 'Bulk import students', module: 'StudentManagement' },
    
    // Course management
    { name: 'course_create', description: 'Create courses', module: 'CourseManagement' },
    { name: 'course_view', description: 'View courses', module: 'CourseManagement' },
    { name: 'course_edit', description: 'Edit courses', module: 'CourseManagement' },
    { name: 'course_delete', description: 'Delete courses', module: 'CourseManagement' },
    
    // Attendance management
    { name: 'attendance_mark', description: 'Mark attendance', module: 'AttendanceSystem' },
    { name: 'attendance_view_own', description: 'View own attendance', module: 'AttendanceSystem' },
    { name: 'attendance_view', description: 'View any attendance', module: 'AttendanceSystem' },
    { name: 'attendance_edit', description: 'Edit attendance', module: 'AttendanceSystem' },
    { name: 'attendance_report', description: 'Generate attendance reports', module: 'AttendanceSystem' },
    
    // System settings
    { name: 'settings_view', description: 'View system settings', module: 'SystemSettings' },
    { name: 'settings_edit', description: 'Edit system settings', module: 'SystemSettings' },
    
    // Backup management
    { name: 'backup_create', description: 'Create database backups', module: 'BackupManagement' },
    { name: 'backup_restore', description: 'Restore database from backup', module: 'BackupManagement' },
    { name: 'backup_delete', description: 'Delete backups', module: 'BackupManagement' }
  ];
  
  for (const permission of permissions) {
    await Permission.findOneAndUpdate(
      { name: permission.name },
      permission,
      { upsert: true, new: true }
    );
  }
  
  logger.info(`${permissions.length} permissions seeded`);
  
  // Assign permissions to roles
  logger.info('Assigning permissions to roles...');
  
  // Get roles
  const adminRole = await Role.findOne({ name: 'Admin' });
  const facultyRole = await Role.findOne({ name: 'Faculty' });
  const hodRole = await Role.findOne({ name: 'HOD' });
  const studentRole = await Role.findOne({ name: 'Student' });
  const staffRole = await Role.findOne({ name: 'Staff' });
  
  // Get permissions
  const allPermissions = await Permission.find({});
  const permissionMap = {};
  allPermissions.forEach(p => {
    permissionMap[p.name] = p._id;
  });
  
  // Admin gets all permissions
  adminRole.permissions = allPermissions.map(p => p._id);
  await adminRole.save();
  
  // Faculty permissions
  facultyRole.permissions = [
    permissionMap.profile_view_own,
    permissionMap.profile_edit_own,
    permissionMap.attendance_mark,
    permissionMap.attendance_view_own,
    permissionMap.attendance_view,
    permissionMap.attendance_report,
    permissionMap.student_view
  ];
  await facultyRole.save();
  
  // HOD permissions
  hodRole.permissions = [
    ...facultyRole.permissions,
    permissionMap.faculty_view,
    permissionMap.faculty_edit,
    permissionMap.faculty_approve,
    permissionMap.attendance_edit
  ];
  await hodRole.save();
  
  // Student permissions
  studentRole.permissions = [
    permissionMap.profile_view_own,
    permissionMap.profile_edit_own,
    permissionMap.attendance_view_own
  ];
  await studentRole.save();
  
  // Staff permissions
  staffRole.permissions = [
    permissionMap.profile_view_own,
    permissionMap.profile_edit_own,
    permissionMap.student_view
  ];
  await staffRole.save();
  
  logger.info('Permissions assigned to roles');
}

/**
 * Seed resource types
 */
async function seedResourceTypes() {
  logger.info('Seeding resource types...');
  
  const resourceTypes = [
    { name: 'faculty', description: 'Faculty members' },
    { name: 'student', description: 'Students' },
    { name: 'course', description: 'Academic courses' },
    { name: 'department', description: 'Academic departments' },
    { name: 'section', description: 'Course sections' },
    { name: 'attendance', description: 'Attendance records' },
    { name: 'timetable', description: 'Class timetable' }
  ];
  
  for (const resourceType of resourceTypes) {
    await ResourceType.findOneAndUpdate(
      { name: resourceType.name },
      resourceType,
      { upsert: true, new: true }
    );
  }
  
  logger.info(`${resourceTypes.length} resource types seeded`);
}

/**
 * Seed users
 */
async function seedUsers() {
  logger.info('Seeding users...');
  
  // Get roles
  const adminRole = await Role.findOne({ name: 'Admin' });
  
  // Create admin user if it doesn't exist
  const adminExists = await User.findOne({ username: 'admin' });
  
  if (!adminExists) {
    const admin = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: 'Admin@123',
      isActive: true,
      isVerified: true,
      roles: [adminRole._id]
    });
    
    await admin.save();
    logger.info('Admin user created');
  } else {
    logger.info('Admin user already exists');
  }
}

/**
 * Seed departments
 */
async function seedDepartments() {
  logger.info('Seeding departments...');
  
  const departments = [
    { name: 'Computer Science', code: 'CSE', description: 'Computer Science and Engineering Department' },
    { name: 'Electrical Engineering', code: 'EEE', description: 'Electrical and Electronics Engineering Department' },
    { name: 'Mechanical Engineering', code: 'MECH', description: 'Mechanical Engineering Department' },
    { name: 'Civil Engineering', code: 'CIVIL', description: 'Civil Engineering Department' },
    { name: 'Information Technology', code: 'IT', description: 'Information Technology Department' }
  ];
  
  for (const department of departments) {
    await Department.findOneAndUpdate(
      { code: department.code },
      department,
      { upsert: true, new: true }
    );
  }
  
  logger.info(`${departments.length} departments seeded`);
}

/**
 * Seed programs
 */
async function seedPrograms() {
  logger.info('Seeding programs...');
  
  // Get departments
  const cseDept = await Department.findOne({ code: 'CSE' });
  const eeeDept = await Department.findOne({ code: 'EEE' });
  const mechDept = await Department.findOne({ code: 'MECH' });
  const civilDept = await Department.findOne({ code: 'CIVIL' });
  const itDept = await Department.findOne({ code: 'IT' });
  
  const programs = [
    { name: 'Bachelor of Technology', code: 'B.TECH', department: cseDept._id, duration: '4 years', degreeType: 'Bachelor\'s' },
    { name: 'Bachelor of Technology', code: 'B.TECH', department: eeeDept._id, duration: '4 years', degreeType: 'Bachelor\'s' },
    { name: 'Bachelor of Technology', code: 'B.TECH', department: mechDept._id, duration: '4 years', degreeType: 'Bachelor\'s' },
    { name: 'Bachelor of Technology', code: 'B.TECH', department: civilDept._id, duration: '4 years', degreeType: 'Bachelor\'s' },
    { name: 'Bachelor of Technology', code: 'B.TECH', department: itDept._id, duration: '4 years', degreeType: 'Bachelor\'s' },
    { name: 'Master of Technology', code: 'M.TECH', department: cseDept._id, duration: '2 years', degreeType: 'Master\'s' },
    { name: 'Master of Technology', code: 'M.TECH', department: eeeDept._id, duration: '2 years', degreeType: 'Master\'s' }
  ];
  
  for (const program of programs) {
    await Program.findOneAndUpdate(
      { code: program.code, department: program.department },
      program,
      { upsert: true, new: true }
    );
  }
  
  logger.info(`${programs.length} programs seeded`);
}

/**
 * Seed branches
 */
async function seedBranches() {
  logger.info('Seeding branches...');
  
  // Get programs
  const btechCse = await Program.findOne({ code: 'B.TECH', department: (await Department.findOne({ code: 'CSE' }))._id });
  const btechEee = await Program.findOne({ code: 'B.TECH', department: (await Department.findOne({ code: 'EEE' }))._id });
  const btechMech = await Program.findOne({ code: 'B.TECH', department: (await Department.findOne({ code: 'MECH' }))._id });
  const btechCivil = await Program.findOne({ code: 'B.TECH', department: (await Department.findOne({ code: 'CIVIL' }))._id });
  const btechIt = await Program.findOne({ code: 'B.TECH', department: (await Department.findOne({ code: 'IT' }))._id });
  
  const branches = [
    { name: 'Computer Science and Engineering', code: 'CSE', program: btechCse._id },
    { name: 'Electrical and Electronics Engineering', code: 'EEE', program: btechEee._id },
    { name: 'Mechanical Engineering', code: 'MECH', program: btechMech._id },
    { name: 'Civil Engineering', code: 'CIVIL', program: btechCivil._id },
    { name: 'Information Technology', code: 'IT', program: btechIt._id }
  ];
  
  for (const branch of branches) {
    await Branch.findOneAndUpdate(
      { code: branch.code, program: branch.program },
      branch,
      { upsert: true, new: true }
    );
  }
  
  logger.info(`${branches.length} branches seeded`);
}

/**
 * Seed academic years
 */
async function seedAcademicYears() {
  logger.info('Seeding academic years...');
  
  const academicYears = [
    { yearName: '2024-2025', startDate: new Date('2024-06-01'), endDate: new Date('2025-05-31'), status: 'active' },
    { yearName: '2023-2024', startDate: new Date('2023-06-01'), endDate: new Date('2024-05-31'), status: 'completed' },
    { yearName: '2025-2026', startDate: new Date('2025-06-01'), endDate: new Date('2026-05-31'), status: 'upcoming' }
  ];
  
  for (const academicYear of academicYears) {
    await AcademicYear.findOneAndUpdate(
      { yearName: academicYear.yearName },
      academicYear,
      { upsert: true, new: true }
    );
  }
  
  logger.info(`${academicYears.length} academic years seeded`);
}

/**
 * Seed semesters
 */
async function seedSemesters() {
  logger.info('Seeding semesters...');
  
  // Get academic years
  const academicYear = await AcademicYear.findOne({ yearName: '2024-2025' });
  
  const semesters = [
    { name: 'Fall 2024', academicYear: academicYear._id, startDate: new Date('2024-06-01'), endDate: new Date('2024-12-31'), status: 'active' },
    { name: 'Spring 2025', academicYear: academicYear._id, startDate: new Date('2025-01-01'), endDate: new Date('2025-05-31'), status: 'upcoming' }
  ];
  
  for (const semester of semesters) {
    await Semester.findOneAndUpdate(
      { name: semester.name, academicYear: semester.academicYear },
      semester,
      { upsert: true, new: true }
    );
  }
  
  logger.info(`${semesters.length} semesters seeded`);
}

/**
 * Seed regulations
 */
async function seedRegulations() {
  logger.info('Seeding regulations...');
  
  // Get programs and branches
  const btechCseBranch = await Branch.findOne({ code: 'CSE' });
  
  const regulations = [
    { 
      name: 'R19 Regulation', 
      code: 'R19', 
      program: btechCseBranch.program, 
      branch: btechCseBranch._id,
      effectiveFromYear: 2019,
      effectiveToYear: 2023
    },
    { 
      name: 'R23 Regulation', 
      code: 'R23', 
      program: btechCseBranch.program, 
      branch: btechCseBranch._id,
      effectiveFromYear: 2023,
      effectiveToYear: null
    }
  ];
  
  for (const regulation of regulations) {
    await Regulation.findOneAndUpdate(
      { code: regulation.code, program: regulation.program, branch: regulation.branch },
      regulation,
      { upsert: true, new: true }
    );
  }
  
  logger.info(`${regulations.length} regulations seeded`);
}

/**
 * Seed course types
 */
async function seedCourseTypes() {
  logger.info('Seeding course types...');
  
  const courseTypes = [
    { name: 'theory', description: 'Theory-based courses' },
    { name: 'practical', description: 'Laboratory/Practical courses' },
    { name: 'project', description: 'Project-based courses' },
    { name: 'seminar', description: 'Seminar-based courses' },
    { name: 'core', description: 'Core/Mandatory courses' },
    { name: 'elective', description: 'Elective courses' },
    { name: 'open_elective', description: 'Open Elective courses across departments' }
  ];
  
  for (const courseType of courseTypes) {
    await CourseType.findOneAndUpdate(
      { name: courseType.name },
      courseType,
      { upsert: true, new: true }
    );
  }
  
  logger.info(`${courseTypes.length} course types seeded`);
}

/**
 * Seed notification templates
 */
async function seedNotificationTemplates() {
  logger.info('Seeding notification templates...');
  
  const templates = [
    {
      templateName: 'Welcome Email',
      templateCode: 'WELCOME_EMAIL',
      subject: 'Welcome to {{institute_name}}',
      body: 'Dear {{name}},\n\nWelcome to {{institute_name}}. Your login credentials are as follows:\n\nUsername: {{username}}\nPassword: {{password}}\n\nPlease change your password upon first login.\n\nRegards,\n{{institute_name}} Team',
      variables: JSON.stringify(['name', 'username', 'password', 'institute_name']),
      smsTemplate: 'Welcome to {{institute_name}}. Your login: {{username}}, pass: {{password}}. Please change password on first login.',
      isActive: true
    },
    {
      templateName: 'Password Reset',
      templateCode: 'PASSWORD_RESET',
      subject: 'Password Reset Request',
      body: 'Dear {{name}},\n\nYou requested a password reset. Please use the following link to reset your password:\n\n{{resetUrl}}\n\nThis link will expire in {{expiryTime}}.\n\nIf you did not request this reset, please ignore this email.\n\nRegards,\n{{institute_name}} Team',
      variables: JSON.stringify(['name', 'resetUrl', 'expiryTime', 'institute_name']),
      smsTemplate: 'Your password reset link: {{resetUrl}} (expires in {{expiryTime}})',
      isActive: true
    },
    {
      templateName: 'Attendance Alert',
      templateCode: 'ATTENDANCE_ALERT',
      subject: 'Attendance Alert: Below Required Percentage',
      body: 'Dear {{name}},\n\nThis is to inform you that your attendance in {{course_name}} is {{attendance_percentage}}%, which is below the required {{minimum_percentage}}%.\n\nPlease improve your attendance to avoid any academic penalties.\n\nRegards,\n{{institute_name}} Team',
      variables: JSON.stringify(['name', 'course_name', 'attendance_percentage', 'minimum_percentage', 'institute_name']),
      smsTemplate: 'Alert: Your attendance in {{course_name}} is {{attendance_percentage}}%, below required {{minimum_percentage}}%.',
      isActive: true
    },
    {
      templateName: 'Fee Payment',
      templateCode: 'FEE_PAYMENT',
      subject: 'Fee Payment Receipt: {{invoice_number}}',
      body: 'Dear {{name}},\n\nWe have received your payment of Rs. {{amount}} towards {{fee_type}} for {{academic_period}}.\n\nInvoice Number: {{invoice_number}}\nPayment Date: {{payment_date}}\nMode of Payment: {{payment_mode}}\n\nRegards,\n{{institute_name}} Team',
      variables: JSON.stringify(['name', 'amount', 'fee_type', 'academic_period', 'invoice_number', 'payment_date', 'payment_mode', 'institute_name']),
      smsTemplate: 'Payment received: Rs.{{amount}} for {{fee_type}}. Invoice: {{invoice_number}}.',
      isActive: true
    }
  ];
  
  for (const template of templates) {
    await NotificationTemplate.findOneAndUpdate(
      { templateCode: template.templateCode },
      template,
      { upsert: true, new: true }
    );
  }
  
  logger.info(`${templates.length} notification templates seeded`);
}

/**
 * Seed system settings
 */
async function seedSystemSettings() {
  logger.info('Seeding system settings...');
  
  const settings = [
    { settingKey: 'institute_name', settingValue: 'College Management System', settingGroup: 'general', isPublic: true, description: 'Name of the educational institution' },
    { settingKey: 'institute_address', settingValue: '123 College Street, Hyderabad, Telangana, India', settingGroup: 'general', isPublic: true, description: 'Address of the educational institution' },
    { settingKey: 'institute_phone', settingValue: '+91 9876543210', settingGroup: 'general', isPublic: true, description: 'Contact phone number' },
    { settingKey: 'institute_email', settingValue: 'info@collegems.edu', settingGroup: 'general', isPublic: true, description: 'Contact email address' },
    
    { settingKey: 'academic_year_current', settingValue: '1', settingGroup: 'academic', isPublic: true, description: 'Current academic year ID' },
    { settingKey: 'semester_current', settingValue: '1', settingGroup: 'academic', isPublic: true, description: 'Current semester ID' },
    { settingKey: 'attendance_minimum_percentage', settingValue: '75', settingGroup: 'academic', isPublic: true, description: 'Minimum attendance percentage required' },
    { settingKey: 'grading_system', settingValue: 'letter', settingGroup: 'academic', isPublic: true, description: 'Grading system type (letter, percentage, gpa)' },
    
    { settingKey: 'enable_faculty_self_service', settingValue: 'true', settingGroup: 'features', isPublic: true, description: 'Enable faculty self-service portal' },
    { settingKey: 'enable_student_self_service', settingValue: 'true', settingGroup: 'features', isPublic: true, description: 'Enable student self-service portal' },
    { settingKey: 'enable_online_fee_payment', settingValue: 'true', settingGroup: 'features', isPublic: true, description: 'Enable online fee payment feature' },
    { settingKey: 'enable_elective_selection', settingValue: 'true', settingGroup: 'features', isPublic: true, description: 'Enable elective selection by students' }
  ];
  
  for (const setting of settings) {
    await SystemSetting.findOneAndUpdate(
      { settingKey: setting.settingKey },
      setting,
      { upsert: true, new: true }
    );
  }
  
  logger.info(`${settings.length} system settings seeded`);
}