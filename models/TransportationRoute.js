// models/TransportationRoute.js
const mongoose = require('mongoose');

const TransportationRouteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  routeNumber: String,
  startLocation: {
    type: String,
    required: true
  },
  endLocation: {
    type: String,
    required: true
  },
  distance: Number,
  routeMapAttachment: String,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  stops: [{
    name: String,
    stopOrder: Number,
    arrivalTime: String,
    departureTime: String,
    coordinates: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('TransportationRoute', TransportationRouteSchema);