const { Schema, model } = require('mongoose');

const DriverSchema = new Schema({
  id: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String,
  fullName: String,
  licenseNumber: String,
  rank: String,
  phone: String,
  notes: String,
  fixedSpeed: Number,
  distance: Number
}, { timestamps: true });

module.exports = model('Driver', DriverSchema);
