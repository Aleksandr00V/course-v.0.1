const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGO_DB_NAME || undefined;
  if (!uri) throw new Error('MONGODB_URI not set in env');
  await mongoose.connect(uri, dbName ? { dbName } : {});
  return mongoose;
}

module.exports = { connectMongo, mongoose };
