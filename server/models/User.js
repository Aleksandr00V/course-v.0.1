const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
  id: { type: String, required: true, unique: true },
  email: String,
  role: String,
  position: String,
  passwordHash: String,
  name: String,
  status: String
}, { timestamps: true });

module.exports = model('User', UserSchema);
