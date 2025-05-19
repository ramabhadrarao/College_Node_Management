// models/Room.js
const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true
  },
  building: String,
  floor: Number,
  roomType: {
    type: String,
    default: 'Classroom'
  },
  capacity: Number,
  hasProjector: {
    type: Boolean,
    default: false
  },
  hasComputer: {
    type: Boolean,
    default: false
  },
  hasAC: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Room', RoomSchema);