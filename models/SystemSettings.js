// models/SystemSettings.js
const mongoose = require('mongoose');

const SystemSettingSchema = new mongoose.Schema({
  settingKey: {
    type: String,
    required: true,
    unique: true
  },
  settingValue: {
    type: String,
    required: true
  },
  settingGroup: String,
  isPublic: {
    type: Boolean,
    default: false
  },
  description: String
}, {
  timestamps: true
});

module.exports = mongoose.model('SystemSetting', SystemSettingSchema);