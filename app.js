// app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');
const { createStream } = require('rotating-file-stream');

const config = require('./config/config');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');

// Initialize Express app
const app = express();

// Create a rotating write stream for access logs
const accessLogStream = createStream('access.log', {
  interval: '1d', // rotate daily
  path: path.join(__dirname, 'logs')
});

// Set security HTTP headers
app.use(helmet());

// CORS middleware
app.use(cors({
  origin: config.security.corsOrigins,
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Cookie parser
app.use(cookieParser());

// Logging
if (config.app.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: accessLogStream }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMax,
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api', limiter);

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// Compression middleware
app.use(compression());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Import route files
const authRoutes = require('./routes/auth.routes');
const facultyRoutes = require('./routes/faculty.routes');
const studentRoutes = require('./routes/student.routes');
const adminRoutes = require('./routes/admin.routes');
const academicCalendarRoutes = require('./routes/academicCalendar.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const feeRoutes = require('./routes/fee.routes');
const examRoutes = require('./routes/exam.routes');
const documentRoutes = require('./routes/document.routes');
const timetableRoutes = require('./routes/timetable.routes');
const courseRoutes = require('./routes/course.routes');
const libraryRoutes = require('./routes/library.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const roomRoutes = require('./routes/room.routes');
// Import our new route files
const userRoutes = require('./routes/user.routes');
const academicRoutes = require('./routes/academic.routes');
const counselingRoutes = require('./routes/counseling.routes');
const transportRoutes = require('./routes/transport.routes');
const scholarshipRoutes = require('./routes/scholarship.routes');
const notificationRoutes = require('./routes/notification.routes');
const menuRoutes = require('./routes/menu.routes');
const learningRoutes = require('./routes/learning.routes');
// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/academic-calendar', academicCalendarRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/rooms', roomRoutes);

// Mount our new routes
app.use('/api/users', userRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/counseling', counselingRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/scholarships', scholarshipRoutes);
app.use('/api/notifications', notificationRoutes);

app.use('/api/menus', menuRoutes);
app.use('/api/learning', learningRoutes);
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    environment: config.app.nodeEnv,
    timestamp: new Date()
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;