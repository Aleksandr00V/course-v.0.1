const { Schema, model } = require('mongoose');

const RequestSchema = new Schema({
  id: { type: String, required: true, unique: true },
  vehicleId: String,
  driverId: String,
  from: String,
  to: String,
  departAt: Date,
  arriveAt: Date,
  kilometers: Number,
  status: String,
  notes: String,
  createdAt: Date
}, { timestamps: true });

module.exports = model('Request', RequestSchema);
