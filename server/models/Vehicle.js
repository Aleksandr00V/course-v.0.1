const { Schema, model } = require('mongoose');

const VehicleSchema = new Schema({
  id: { type: String, required: true, unique: true },
  make: String,
  model: String,
  type: String,
  status: String,
  assignedUnit: String,
  vin: String,
  registrationNumber: String,
  year: Number,
  mileage: Number,
  notes: String
}, { timestamps: true });

module.exports = model('Vehicle', VehicleSchema);
