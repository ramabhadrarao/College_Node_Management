// models/AttendanceValidationRule.js
const mongoose = require('mongoose');

const AttendanceValidationRuleSchema = new mongoose.Schema({
  ruleName: {
    type: String,
    required: true
  },
  ruleCondition: {
    type: String,
    required: true
  },
  ruleAction: {
    type: String,
    enum: ['allow', 'deny', 'require_approval'],
    required: true
  },
  priority: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AttendanceValidationRule', AttendanceValidationRuleSchema);
