// controllers/backup.controller.js
const backupService = require('../services/backupService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * List all database backups
 * @route GET /api/admin/backups
 * @access Admin
 */
exports.listBackups = catchAsync(async (req, res, next) => {
  const backups = await backupService.listBackups();
  
  res.status(200).json({
    status: 'success',
    results: backups.length,
    data: {
      backups
    }
  });
});

/**
 * Create a new database backup
 * @route POST /api/admin/backups
 * @access Admin
 */
exports.createBackup = catchAsync(async (req, res, next) => {
  const backup = await backupService.createDatabaseBackup();
  
  res.status(201).json({
    status: 'success',
    message: 'Database backup created successfully',
    data: {
      backup
    }
  });
});

/**
 * Restore database from backup
 * @route POST /api/admin/backups/:filename/restore
 * @access Admin
 */
exports.restoreBackup = catchAsync(async (req, res, next) => {
  const { filename } = req.params;
  
  const success = await backupService.restoreDatabaseBackup(filename);
  
  if (!success) {
    return next(new AppError('Failed to restore database from backup', 500));
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Database restored successfully from backup',
    data: {
      filename
    }
  });
});

/**
 * Delete a backup
 * @route DELETE /api/admin/backups/:filename
 * @access Admin
 */
exports.deleteBackup = catchAsync(async (req, res, next) => {
  const { filename } = req.params;
  
  const success = await backupService.deleteBackup(filename);
  
  if (!success) {
    return next(new AppError('Failed to delete backup', 500));
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Backup deleted successfully',
    data: null
  });
});

module.exports = exports;