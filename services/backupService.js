// services/backupService.js
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { spawn } = require('child_process');
const { createGzip } = require('zlib');
const { pipeline } = require('stream');
const config = require('../config/config');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

// Promisify fs functions
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);
const pipelineAsync = promisify(pipeline);

/**
 * Ensure backup directory exists
 * @returns {Promise<void>}
 */
const ensureBackupDirExists = async () => {
  try {
    await stat(config.backups.backupDir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await mkdir(config.backups.backupDir, { recursive: true });
    } else {
      throw error;
    }
  }
};

/**
 * Create backup filename with timestamp
 * @returns {string} - Backup filename
 */
const createBackupFilename = () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `backup-${timestamp}.gz`;
};

/**
 * Create database backup using mongodump
 * @returns {Promise<Object>} - Backup result
 */
const createDatabaseBackup = async () => {
  try {
    await ensureBackupDirExists();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(config.backups.backupDir, `dump-${timestamp}`);
    const archiveFilename = createBackupFilename();
    const archivePath = path.join(config.backups.backupDir, archiveFilename);
    
    // Get database connection info from mongoose
    const { host, port, name } = mongoose.connection;
    
    // Create backup directory
    await mkdir(backupDir, { recursive: true });
    
    return new Promise((resolve, reject) => {
      // Use mongodump to create backup
      const mongodump = spawn('mongodump', [
        `--host=${host || 'localhost'}`,
        `--port=${port || 27017}`,
        `--db=${name}`,
        `--out=${backupDir}`
      ]);
      
      let output = '';
      let errorOutput = '';
      
      mongodump.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      mongodump.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      mongodump.on('close', async (code) => {
        if (code !== 0) {
          logger.error(`mongodump process exited with code ${code}`);
          logger.error(`mongodump error: ${errorOutput}`);
          return reject(new Error(`Backup failed with code ${code}`));
        }
        
        try {
          // Compress the backup directory
          await compressDirectory(backupDir, archivePath);
          
          // Remove the uncompressed backup
          const rimraf = promisify(require('rimraf'));
          await rimraf(backupDir);
          
          logger.info(`Database backup created: ${archiveFilename}`);
          resolve({
            filename: archiveFilename,
            path: archivePath,
            timestamp: new Date(),
            size: (await stat(archivePath)).size
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  } catch (error) {
    logger.error('Error creating database backup:', error);
    throw error;
  }
};

/**
 * Compress directory to gzip archive
 * @param {string} sourceDir - Source directory
 * @param {string} destFile - Destination file
 * @returns {Promise<void>}
 */
const compressDirectory = async (sourceDir, destFile) => {
  try {
    const tar = spawn('tar', ['-czf', destFile, '-C', path.dirname(sourceDir), path.basename(sourceDir)]);
    
    return new Promise((resolve, reject) => {
      tar.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(`tar process exited with code ${code}`));
        }
        resolve();
      });
      
      tar.on('error', (error) => {
        reject(error);
      });
    });
  } catch (error) {
    logger.error('Error compressing directory:', error);
    throw error;
  }
};

/**
 * Restore database from backup
 * @param {string} backupFile - Backup filename
 * @returns {Promise<boolean>} - Success status
 */
const restoreDatabaseBackup = async (backupFile) => {
  try {
    const backupPath = path.join(config.backups.backupDir, backupFile);
    
    // Check if backup file exists
    try {
      await stat(backupPath);
    } catch (error) {
      logger.error(`Backup file not found: ${backupPath}`);
      return false;
    }
    
    // Create temp directory for extraction
    const timestamp = Date.now();
    const extractDir = path.join(config.backups.backupDir, `temp-${timestamp}`);
    await mkdir(extractDir, { recursive: true });
    
    // Extract the backup
    await new Promise((resolve, reject) => {
      const tar = spawn('tar', ['-xzf', backupPath, '-C', extractDir]);
      
      tar.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(`tar extraction failed with code ${code}`));
        }
        resolve();
      });
      
      tar.on('error', (error) => {
        reject(error);
      });
    });
    
    // Find the dump directory
    const files = await readdir(extractDir);
    const dumpDir = files.find((file) => file.startsWith('dump-'));
    
    if (!dumpDir) {
      throw new Error('Invalid backup format: dump directory not found');
    }
    
    // Get database connection info from mongoose
    const { host, port, name } = mongoose.connection;
    
    // Restore the database
    return new Promise((resolve, reject) => {
      const mongorestore = spawn('mongorestore', [
        `--host=${host || 'localhost'}`,
        `--port=${port || 27017}`,
        '--drop', // Drop existing collections
        `--db=${name}`,
        path.join(extractDir, dumpDir, name)
      ]);
      
      let output = '';
      let errorOutput = '';
      
      mongorestore.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      mongorestore.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      mongorestore.on('close', async (code) => {
        try {
          // Clean up temp directory
          const rimraf = promisify(require('rimraf'));
          await rimraf(extractDir);
          
          if (code !== 0) {
            logger.error(`mongorestore process exited with code ${code}`);
            logger.error(`mongorestore error: ${errorOutput}`);
            return reject(new Error(`Restore failed with code ${code}`));
          }
          
          logger.info(`Database restored from backup: ${backupFile}`);
          resolve(true);
        } catch (error) {
          reject(error);
        }
      });
    });
  } catch (error) {
    logger.error('Error restoring database backup:', error);
    return false;
  }
};

/**
 * List available backups
 * @returns {Promise<Array>} - List of backups
 */
const listBackups = async () => {
  try {
    await ensureBackupDirExists();
    
    const files = await readdir(config.backups.backupDir);
    const backupFiles = files.filter((file) => file.startsWith('backup-') && file.endsWith('.gz'));
    
    const backups = await Promise.all(
      backupFiles.map(async (file) => {
        const filePath = path.join(config.backups.backupDir, file);
        const stats = await stat(filePath);
        
        return {
          filename: file,
          path: filePath,
          timestamp: stats.mtime,
          size: stats.size
        };
      })
    );
    
    // Sort by timestamp (newest first)
    return backups.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    logger.error('Error listing backups:', error);
    return [];
  }
};

/**
 * Delete a backup
 * @param {string} backupFile - Backup filename
 * @returns {Promise<boolean>} - Success status
 */
const deleteBackup = async (backupFile) => {
  try {
    const backupPath = path.join(config.backups.backupDir, backupFile);
    
    try {
      await stat(backupPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.warn(`Backup file not found: ${backupPath}`);
        return false;
      }
      throw error;
    }
    
    await unlink(backupPath);
    logger.info(`Backup deleted: ${backupFile}`);
    return true;
  } catch (error) {
    logger.error('Error deleting backup:', error);
    return false;
  }
};

/**
 * Manage old backups (keep only a certain number of recent backups)
 * @param {number} [keepCount=10] - Number of backups to keep
 * @returns {Promise<number>} - Number of deleted backups
 */
const pruneOldBackups = async (keepCount = 10) => {
  try {
    const backups = await listBackups();
    
    if (backups.length <= keepCount) {
      return 0;
    }
    
    // Get backups to delete (oldest first)
    const toDelete = backups.slice(keepCount);
    
    let deletedCount = 0;
    for (const backup of toDelete) {
      const success = await deleteBackup(backup.filename);
      if (success) {
        deletedCount++;
      }
    }
    
    return deletedCount;
  } catch (error) {
    logger.error('Error pruning old backups:', error);
    return 0;
  }
};

module.exports = {
  createDatabaseBackup,
  restoreDatabaseBackup,
  listBackups,
  deleteBackup,
  pruneOldBackups
};