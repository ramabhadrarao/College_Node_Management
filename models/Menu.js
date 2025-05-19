
// models/Menu.js
const mongoose = require('mongoose');

const MenuSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Menu', MenuSchema);