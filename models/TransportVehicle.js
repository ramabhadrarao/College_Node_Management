// models/TransportVehicle.js
const mongoose = require('mongoose');

const TransportVehicleSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: true
  },
  vehicleType: String,
  make: String,
  model: String,
  capacity: Number,
  driverName: String,
  driverContact: String,
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TransportationRoute'
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TransportVehicle', TransportVehicleSchema);