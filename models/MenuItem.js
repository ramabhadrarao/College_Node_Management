// models/MenuItem.js
const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  menu: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Menu',
    required: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  },
  title: {
    type: String,
    required: true
  },
  route: String,
  icon: String,
  itemOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  target: {
    type: String,
    default: '_self'
  },
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('MenuItem', MenuItemSchema);