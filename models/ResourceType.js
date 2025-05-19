// models/ResourceType.js
const mongoose = require('mongoose');

const ResourceTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String
}, {
  timestamps: true
});

module.exports = mongoose.model('ResourceType', ResourceTypeSchema);