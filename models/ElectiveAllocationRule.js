// models/ElectiveAllocationRule.js
const mongoose = require('mongoose');

const ElectiveAllocationRuleSchema = new mongoose.Schema({
  electiveGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElectiveGroup',
    required: true
  },
  ruleName: {
    type: String,
    required: true
  },
  ruleCondition: {
    type: String,
    required: true
  },
  rulePriority: {
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

module.exports = mongoose.model('ElectiveAllocationRule', ElectiveAllocationRuleSchema);
