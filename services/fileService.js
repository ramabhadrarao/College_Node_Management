// services/fileService.js
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const crypto = require('crypto');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const { PassThrough } = require('stream');
const config = require('../config/config');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

// Promisify fs functions
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);

/**
 * Ensure upload directory exists
 * @param {string} dirPath - Directory path
 * @returns {Promise<void>}
 */
const ensureDirectoryExists = async (dirPath) => {
  try {
    await stat(dirPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await mkdir(dirPath, { recursive: true });
    } else {
      throw error;
    }
  }
};

/**
 * Generate unique filename
 * @param {string} originalName - Original filename
 * @returns {string} - Unique filename
 */
const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalName);
  return `${timestamp}-${randomString}${extension}`;
};

/**
 * Upload file to server
 * @param {Object} file - File object from request
 * @param {string} [subDirectory=''] - Subdirectory within upload directory
 * @returns {Promise<string>} - File path relative to upload directory
 */
const uploadFile = async (file, subDirectory = '') => {
  try {
    // Get upload directory
    const uploadDir = config.storage.uploadDir;
    const targetDir = path.join(uploadDir, subDirectory);
    
    // Ensure upload directory exists
    await ensureDirectoryExists(targetDir);
    
    // Generate unique filename
    const filename = generateUniqueFilename(file.name);
    const filePath = path.join(targetDir, filename);
    
    // Write file to disk
    await writeFile(filePath, file.data);
    
    // Return relative path for database storage
    return path.join(subDirectory, filename);
  } catch (error) {
    logger.error('Error uploading file:', error);
    throw new AppError('Failed to upload file', 500);
  }
};

/**
 * Delete file from server
 * @param {string} filePath - File path relative to upload directory
 * @returns {Promise<boolean>} - Success status
 */
const deleteFile = async (filePath) => {
  try {
    if (!filePath) return false;
    
    const fullPath = path.join(config.storage.uploadDir, filePath);
    
    try {
      await stat(fullPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, consider it deleted
        return true;
      }
      throw error;
    }
    
    await unlink(fullPath);
    return true;
  } catch (error) {
    logger.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Process CSV or Excel file
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} mimeType - File MIME type
 * @returns {Promise<Array>} - Parsed data as array of objects
 */
const processFile = async (fileBuffer, mimeType) => {
  try {
    // Handle Excel files
    if (mimeType === 'application/vnd.ms-excel' || 
        mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      return xlsx.utils.sheet_to_json(worksheet, { defval: null });
    }
    
    // Handle CSV files
    else if (mimeType === 'text/csv') {
      return new Promise((resolve, reject) => {
        const results = [];
        
        // Create a PassThrough stream from the buffer
        const bufferStream = new PassThrough();
        bufferStream.end(fileBuffer);
        
        bufferStream
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => resolve(results))
          .on('error', (error) => reject(error));
      });
    }
    
    throw new AppError('Unsupported file type', 400);
  } catch (error) {
    logger.error('Error processing file:', error);
    throw new AppError('Failed to process file', 500);
  }
};

/**
 * Get file information
 * @param {string} filePath - File path relative to upload directory
 * @returns {Promise<Object|null>} - File information or null if not found
 */
const getFileInfo = async (filePath) => {
  try {
    if (!filePath) return null;
    
    const fullPath = path.join(config.storage.uploadDir, filePath);
    
    try {
      const stats = await stat(fullPath);
      return {
        path: filePath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        exists: true
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {
          path: filePath,
          exists: false
        };
      }
      throw error;
    }
  } catch (error) {
    logger.error('Error getting file info:', error);
    return null;
  }
};

/**
 * Get files in directory
 * @param {string} [subDirectory=''] - Subdirectory within upload directory
 * @returns {Promise<Array>} - Array of file information
 */
const getFilesInDirectory = async (subDirectory = '') => {
  try {
    const dirPath = path.join(config.storage.uploadDir, subDirectory);
    
    try {
      await stat(dirPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
    
    const files = await readdir(dirPath);
    
    const fileInfoPromises = files.map(async (file) => {
      const filePath = path.join(subDirectory, file);
      return await getFileInfo(filePath);
    });
    
    return (await Promise.all(fileInfoPromises)).filter(Boolean);
  } catch (error) {
    logger.error('Error getting files in directory:', error);
    return [];
  }
};

module.exports = {
  uploadFile,
  deleteFile,
  processFile,
  getFileInfo,
  getFilesInDirectory
};