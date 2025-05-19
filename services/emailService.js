// services/emailService.js
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Create a transporter for sending emails
 */
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.auth.user,
    pass: config.email.auth.pass
  }
});

/**
 * Verify email configuration on startup
 */
const verifyEmailSetup = async () => {
  try {
    await transporter.verify();
    logger.info('Email service is ready to send emails');
    return true;
  } catch (error) {
    logger.error('Email service failed to initialize:', error);
    return false;
  }
};

/**
 * Read and compile email template
 * @param {string} templateName - Name of the template file without extension
 * @param {Object} data - Data to be passed to the template
 * @returns {string} - Compiled HTML
 */
const getCompiledTemplate = (templateName, data) => {
  try {
    const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.hbs`);
    const template = fs.readFileSync(templatePath, 'utf8');
    const compiledTemplate = handlebars.compile(template);
    return compiledTemplate(data);
  } catch (error) {
    logger.error(`Error compiling email template ${templateName}:`, error);
    throw new Error(`Could not compile email template ${templateName}`);
  }
};

/**
 * Send email
 * @param {Object} options - Email options
 * @returns {Promise<boolean>} - Success status
 */
const sendEmail = async (options) => {
  try {
    const { to, subject, template, data, attachments = [] } = options;
    
    let html;
    if (template) {
      html = getCompiledTemplate(template, data);
    }

    const mailOptions = {
      from: options.from || config.email.from,
      to,
      subject,
      text: options.text,
      html,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    
    return true;
  } catch (error) {
    logger.error('Error sending email:', error);
    return false;
  }
};

/**
 * Send welcome email to new user
 * @param {Object} user - User object
 * @param {string} password - Clear text password (only for new users)
 * @returns {Promise<boolean>} - Success status
 */
const sendWelcomeEmail = async (user, password = null) => {
  try {
    const data = {
      name: user.name || `${user.firstName} ${user.lastName}`,
      username: user.username || user.email,
      password: password,
      loginUrl: `${config.app.frontendUrl}/login`,
      supportEmail: config.email.from
    };

    await sendEmail({
      to: user.email,
      subject: 'Welcome to College Management System',
      template: 'welcome',
      data
    });

    return true;
  } catch (error) {
    logger.error('Error sending welcome email:', error);
    return false;
  }
};

/**
 * Send password reset email
 * @param {Object} user - User object
 * @param {string} resetToken - Reset token
 * @returns {Promise<boolean>} - Success status
 */
const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const resetUrl = `${config.app.frontendUrl}/reset-password/${resetToken}`;
    
    const data = {
      name: user.name || `${user.firstName} ${user.lastName}`,
      resetUrl,
      supportEmail: config.email.from,
      expiryTime: '1 hour'
    };

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      template: 'password-reset',
      data
    });

    return true;
  } catch (error) {
    logger.error('Error sending password reset email:', error);
    return false;
  }
};

/**
 * Send notification email
 * @param {Object} options - Notification options
 * @returns {Promise<boolean>} - Success status
 */
const sendNotificationEmail = async (options) => {
  try {
    const { user, subject, message, template, data } = options;
    
    let emailData = data || {};
    emailData.name = user.name || `${user.firstName} ${user.lastName}`;
    emailData.message = message;
    
    await sendEmail({
      to: user.email,
      subject,
      template: template || 'notification',
      data: emailData
    });

    return true;
  } catch (error) {
    logger.error('Error sending notification email:', error);
    return false;
  }
};

module.exports = {
  verifyEmailSetup,
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendNotificationEmail
};