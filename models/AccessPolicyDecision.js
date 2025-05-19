// models/AccessPolicyDecision.js
const mongoose = require('mongoose');

const AccessPolicyDecisionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resourceType: {
    type: String,
    required: true
  },
  resourceId: {
    type: String,
    required: true
  },
  permission: {
    type: String,
    required: true
  },
  isAllowed: {
    type: Boolean,
    default: false
  },
  decisionReason: String,
  expiryTimestamp: Date
}, {
  timestamps: true
});

// Compound index for looking up decisions
AccessPolicyDecisionSchema.index(
  { user: 1, resourceType: 1, resourceId: 1, permission: 1 },
  { unique: true }
);

module.exports = mongoose.model('AccessPolicyDecision', AccessPolicyDecisionSchema);
