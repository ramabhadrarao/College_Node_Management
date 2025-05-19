// controllers/system.controller.js
const SystemSetting = require('../models/SystemSetting');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * Get all system settings
 * @route GET /api/admin/settings
 * @access Admin
 */
exports.getSettings = catchAsync(async (req, res, next) => {
  const settings = await SystemSetting.find().sort('settingGroup settingKey');
  
  // Group settings by group
  const groupedSettings = settings.reduce((groups, setting) => {
    const group = setting.settingGroup || 'general';
    
    if (!groups[group]) {
      groups[group] = [];
    }
    
    groups[group].push(setting);
    
    return groups;
  }, {});
  
  res.status(200).json({
    status: 'success',
    results: settings.length,
    data: {
      settings: groupedSettings
    }
  });
});

/**
 * Get a single system setting
 * @route GET /api/admin/settings/:key
 * @access Admin
 */
exports.getSetting = catchAsync(async (req, res, next) => {
  const { key } = req.params;
  
  const setting = await SystemSetting.findOne({ settingKey: key });
  
  if (!setting) {
    return next(new AppError('Setting not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      setting
    }
  });
});

/**
 * Update a system setting
 * @route PUT /api/admin/settings/:key
 * @access Admin
 */
exports.updateSetting = catchAsync(async (req, res, next) => {
  const { key } = req.params;
  const { setting_value, description, is_public } = req.body;
  
  if (!setting_value) {
    return next(new AppError('Setting value is required', 400));
  }
  
  const updatedSetting = await SystemSetting.findOneAndUpdate(
    { settingKey: key },
    {
      settingValue: setting_value,
      ...(description && { description }),
      ...(is_public !== undefined && { isPublic: is_public })
    },
    { new: true, runValidators: true }
  );
  
  if (!updatedSetting) {
    return next(new AppError('Setting not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Setting updated successfully',
    data: {
      setting: updatedSetting
    }
  });
});

/**
 * Create a new system setting
 * @route POST /api/admin/settings
 * @access Admin
 */
exports.createSetting = catchAsync(async (req, res, next) => {
  const { setting_key, setting_value, setting_group, description, is_public } = req.body;
  
  if (!setting_key || !setting_value) {
    return next(new AppError('Setting key and value are required', 400));
  }
  
  // Check if setting already exists
  const existingSetting = await SystemSetting.findOne({ settingKey: setting_key });
  if (existingSetting) {
    return next(new AppError('Setting key already exists', 400));
  }
  
  const newSetting = await SystemSetting.create({
    settingKey: setting_key,
    settingValue: setting_value,
    settingGroup: setting_group || 'general',
    description: description || '',
    isPublic: is_public || false
  });
  
  res.status(201).json({
    status: 'success',
    message: 'Setting created successfully',
    data: {
      setting: newSetting
    }
  });
});

/**
 * Delete a system setting
 * @route DELETE /api/admin/settings/:key
 * @access Admin
 */
exports.deleteSetting = catchAsync(async (req, res, next) => {
  const { key } = req.params;
  
  const setting = await SystemSetting.findOneAndDelete({ settingKey: key });
  
  if (!setting) {
    return next(new AppError('Setting not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Setting deleted successfully',
    data: null
  });
});

/**
 * Get public settings
 * @route GET /api/settings/public
 * @access Public
 */
exports.getPublicSettings = catchAsync(async (req, res, next) => {
  const settings = await SystemSetting.find({ isPublic: true });
  
  // Convert to key-value object
  const publicSettings = settings.reduce((result, setting) => {
    result[setting.settingKey] = setting.settingValue;
    return result;
  }, {});
  
  res.status(200).json({
    status: 'success',
    data: {
      settings: publicSettings
    }
  });
});

module.exports = exports;