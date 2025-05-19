// models/HostelRoom.js
const mongoose = require('mongoose');

const HostelRoomSchema = new mongoose.Schema({
  building: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HostelBuilding',
    required: true
  },
  roomNumber: {
    type: String,
    required: true
  },
  floor: Number,
  roomType: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    default: 1
  },
  occupied: {
    type: Number,
    default: 0
  },
  hasAttachedBathroom: {
    type: Boolean,
    default: false
  },
  hasAC: {
    type: Boolean,
    default: false
  },
  monthlyRent: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['available', 'full', 'maintenance', 'reserved'],
    default: 'available'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('HostelRoom', HostelRoomSchema);