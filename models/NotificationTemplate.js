// models/NotificationTemplate.js
const mongoose = require('mongoose');

const NotificationTemplateSchema = new mongoose.Schema({
  templateName: {
    type: String,
    required: true
  },
  templateCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  subject: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  variables: {
    type: String, // JSON string array of variables
    default: '[]'
  },
  smsTemplate: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual to parse variables as JSON
NotificationTemplateSchema.virtual('variablesArray').get(function() {
  try {
    return JSON.parse(this.variables);
  } catch (error) {
    return [];
  }
});

module.exports = mongoose.model('NotificationTemplate', NotificationTemplateSchema);