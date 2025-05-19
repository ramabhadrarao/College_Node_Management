// models/SystemSetting.js
const mongoose = require('mongoose');

const SystemSettingSchema = new mongoose.Schema({
  settingKey: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  settingValue: {
    type: String,
    required: true
  },
  settingGroup: {
    type: String,
    default: 'general',
    trim: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  description: String
}, {
  timestamps: true
});

module.exports = mongoose.model('SystemSetting', SystemSettingSchema);