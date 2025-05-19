// models/HostelBuilding.js
const mongoose = require('mongoose');

const HostelBuildingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  buildingType: {
    type: String,
    required: true
  },
  address: String,
  totalRooms: {
    type: Number,
    default: 0
  },
  wardenName: String,
  wardenContact: String,
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('HostelBuilding', HostelBuildingSchema);