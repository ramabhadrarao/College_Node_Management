// models/LibrarySetting.js
const mongoose = require('mongoose');

const LibrarySettingSchema = new mongoose.Schema({
  settingKey: {
    type: String,
    required: true,
    unique: true
  },
  settingValue: {
    type: String,
    required: true
  },
  description: String
}, {
  timestamps: true
});

module.exports = mongoose.model('LibrarySetting', LibrarySettingSchema);