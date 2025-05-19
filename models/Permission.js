// models/Permission.js
const mongoose = require('mongoose');

const PermissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  module: String,
  resources: [{
    resourceType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ResourceType'
    },
    conditionType: String,
    conditionValue: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Permission', PermissionSchema);