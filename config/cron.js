// config/cron.js
const cron = require('node-cron');
const backupService = require('../services/backupService');
const attendanceService = require('../services/attendanceService');
const notificationService = require('../services/notificationService');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const AttendanceSummary = require('../models/AttendanceSummary');
const StudentFeeInvoice = require('../models/StudentFeeInvoice');
const logger = require('../utils/logger');
const config = require('./config');

/**
 * Initialize all cron jobs
 */
const initCronJobs = () => {
  // Daily database backup at midnight
  cron.schedule(config.backups.frequency, async () => {
    logger.info('Running scheduled database backup');
    try {
      const backupResult = await backupService.createDatabaseBackup();
      logger.info(`Backup created: ${backupResult.filename}`);
      
      // Keep only the last 10 backups
      const prunedCount = await backupService.pruneOldBackups(10);
      if (prunedCount > 0) {
        logger.info(`Pruned ${prunedCount} old backups`);
      }
    } catch (error) {
      logger.error('Scheduled backup failed:', error);
    }
  });

  // Update attendance summaries daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    logger.info('Running attendance summary update');
    try {
      const updatedCount = await updateAttendanceSummaries();
      logger.info(`Updated ${updatedCount} attendance summaries`);
    } catch (error) {
      logger.error('Attendance summary update failed:', error);
    }
  });

  // Send fee payment reminders weekly on Monday at 9 AM
  cron.schedule('0 9 * * 1', async () => {
    logger.info('Sending fee payment reminders');
    try {
      const reminderCount = await sendFeePaymentReminders();
      logger.info(`Sent ${reminderCount} fee payment reminders`);
    } catch (error) {
      logger.error('Fee payment reminders failed:', error);
    }
  });

  // Send attendance alert for students with low attendance monthly on 1st at 10 AM
  cron.schedule('0 10 1 * *', async () => {
    logger.info('Sending attendance alerts');
    try {
      const alertCount = await sendAttendanceAlerts();
      logger.info(`Sent ${alertCount} attendance alerts`);
    } catch (error) {
      logger.error('Attendance alerts failed:', error);
    }
  });

  // Clean up old notifications every Sunday at 3 AM
  cron.schedule('0 3 * * 0', async () => {
    logger.info('Cleaning up old notifications');
    try {
      const deletedCount = await cleanupOldNotifications();
      logger.info(`Deleted ${deletedCount} old notifications`);
    } catch (error) {
      logger.error('Notification cleanup failed:', error);
    }
  });

  logger.info('All cron jobs scheduled successfully');
};

/**
 * Update attendance summaries for all students
 * @returns {Promise<number>} - Number of updated summaries
 */
const updateAttendanceSummaries = async () => {
  try {
    // Get all active students
    const students = await Student.find({ status: 'active' });
    let updateCount = 0;

    // Process each student
    for (const student of students) {
      try {
        // Get all courses the student is registered for
        const enrolledCourses = await StudentSectionAssignment.find({
          student: student._id,
          isActive: true
        });

        // Update summary for each course
        for (const enrollment of enrolledCourses) {
          // Get attendance records for this course
          const attendanceRecords = await Attendance.find({
            student: student._id,
            course: enrollment.course,
            section: enrollment.section
          });

          if (attendanceRecords.length === 0) continue;

          // Calculate statistics
          const totalClasses = attendanceRecords.length;
          const classesAttended = attendanceRecords.filter(a => a.status === 'Present').length;
          const attendancePercentage = (classesAttended / totalClasses) * 100;

          // Get minimum required attendance from settings
          const minAttendancePercentage = 75; // Default, would fetch from settings in real implementation

          // Check if at risk
          const attendanceStatus = attendancePercentage < minAttendancePercentage ? 'At Risk' : 'Good Standing';

          // Find existing summary or create new one
          const summary = await AttendanceSummary.findOneAndUpdate(
            {
              student: student._id,
              course: enrollment.course,
              section: enrollment.section,
              semester: enrollment.semester,
              academicYear: enrollment.academicYear
            },
            {
              totalClasses,
              classesAttended,
              attendancePercentage,
              attendanceStatus,
              lastUpdated: new Date()
            },
            { upsert: true, new: true }
          );

          updateCount++;
        }
      } catch (error) {
        logger.error(`Error updating attendance summary for student ${student._id}:`, error);
      }
    }

    return updateCount;
  } catch (error) {
    logger.error('Error updating attendance summaries:', error);
    throw error;
  }
};

/**
 * Send fee payment reminders for pending invoices
 * @returns {Promise<number>} - Number of reminders sent
 */
const sendFeePaymentReminders = async () => {
  try {
    // Find pending invoices with due date approaching (within next 7 days)
    const pendingInvoices = await StudentFeeInvoice.find({
      status: { $in: ['pending', 'partially_paid'] },
      dueDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Within next 7 days
      }
    }).populate('student');

    let reminderCount = 0;

    // Send reminder for each invoice
    for (const invoice of pendingInvoices) {
      try {
        // Get user associated with student
        const student = await Student.findById(invoice.student).populate('user');

        if (!student || !student.user) continue;

        // Create notification
        await notificationService.createNotificationFromTemplate({
          userId: student.user._id,
          templateCode: 'FEE_PAYMENT',
          templateData: {
            name: student.name,
            amount: invoice.totalAmount,
            fee_type: 'Semester Fee', // This would be more specific in real implementation
            academic_period: `${invoice.semester.name} ${invoice.academicYear.year_name}`,
            invoice_number: invoice.invoiceNumber,
            payment_date: invoice.dueDate.toLocaleDateString(),
            payment_mode: 'Online Payment'
          },
          relatedEntity: 'invoice',
          relatedId: invoice._id,
          sendEmail: true
        });

        reminderCount++;
      } catch (error) {
        logger.error(`Error sending fee reminder for invoice ${invoice._id}:`, error);
      }
    }

    return reminderCount;
  } catch (error) {
    logger.error('Error sending fee payment reminders:', error);
    throw error;
  }
};

/**
 * Send attendance alerts for students with low attendance
 * @returns {Promise<number>} - Number of alerts sent
 */
const sendAttendanceAlerts = async () => {
  try {
    // Get minimum required attendance from settings
    const minAttendancePercentage = 75; // Default, would fetch from settings in real implementation

    // Find students with low attendance
    const lowAttendanceSummaries = await AttendanceSummary.find({
      attendancePercentage: { $lt: minAttendancePercentage },
      attendanceStatus: 'At Risk'
    }).populate('student course');

    let alertCount = 0;

    // Send alert for each student
    for (const summary of lowAttendanceSummaries) {
      try {
        // Get user associated with student
        const student = await Student.findById(summary.student._id).populate('user');

        if (!student || !student.user) continue;

        // Create notification
        await notificationService.createNotificationFromTemplate({
          userId: student.user._id,
          templateCode: 'ATTENDANCE_ALERT',
          templateData: {
            name: student.name,
            course_name: summary.course.name,
            attendance_percentage: summary.attendancePercentage.toFixed(2),
            minimum_percentage: minAttendancePercentage,
            institute_name: 'College Management System'
          },
          relatedEntity: 'attendance',
          relatedId: summary._id,
          sendEmail: true
        });

        alertCount++;
      } catch (error) {
        logger.error(`Error sending attendance alert for student ${summary.student._id}:`, error);
      }
    }

    return alertCount;
  } catch (error) {
    logger.error('Error sending attendance alerts:', error);
    throw error;
  }
};

/**
 * Clean up old read notifications
 * @returns {Promise<number>} - Number of deleted notifications
 */
const cleanupOldNotifications = async () => {
  try {
    // Delete notifications that are older than 90 days and have been read
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const result = await UserNotification.deleteMany({
      isRead: true,
      createdAt: { $lt: threeMonthsAgo }
    });

    return result.deletedCount;
  } catch (error) {
    logger.error('Error cleaning up old notifications:', error);
    throw error;
  }
};

module.exports = {
  initCronJobs
};