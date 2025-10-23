const { Schema, model } = require('mongoose');

const TripSchema = new Schema({
  id: { type: String, required: true, unique: true },
  driverId: String,
  vehicleId: String,
  date: Date,
  distanceKm: Number,
  notes: String
}, { timestamps: true });

module.exports = model('Trip', TripSchema);
