/*
  Usage:
    Set env: MONGODB_URI and MONGO_DB_NAME (optional)
    node scripts/seed-mongo.js
*/
const fs = require('fs');
const path = require('path');
const { connectMongo, mongoose } = require('../server/lib/mongoose');

async function seed() {
  try {
    await connectMongo();
    const dbPath = path.join(__dirname, '..', 'server', 'db.json');
    const raw = fs.readFileSync(dbPath, 'utf8');
    const data = JSON.parse(raw);

    const Vehicle = require('../server/models/Vehicle');
    const Driver = require('../server/models/Driver');
    const User = require('../server/models/User');
    const Trip = require('../server/models/Trip');
    const Request = require('../server/models/Request');

    // Upsert helper
    const upsertMany = async (Model, items) => {
      for (const it of items) {
        await Model.updateOne({ id: it.id }, { $set: it }, { upsert: true });
      }
    };

    if (Array.isArray(data.vehicles)) await upsertMany(Vehicle, data.vehicles);
    if (Array.isArray(data.drivers)) await upsertMany(Driver, data.drivers);
    if (Array.isArray(data.users)) await upsertMany(User, data.users);
    if (Array.isArray(data.trips)) await upsertMany(Trip, data.trips.map(t => ({ ...t, date: t.date ? new Date(t.date) : null })));
    if (Array.isArray(data.requests)) await upsertMany(Request, data.requests.map(r => ({ ...r, departAt: r.departAt ? new Date(r.departAt) : null, createdAt: r.createdAt ? new Date(r.createdAt) : null })));

    // Create/update superadmin
    try {
      const bcrypt = require('bcryptjs');
      const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@example.com';
      const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || 'ChangeMe123!';
      const SUPERADMIN_ID = process.env.SUPERADMIN_ID || 'superadmin-1';

      const passwordHash = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);
      const superuser = {
        id: SUPERADMIN_ID,
        email: SUPERADMIN_EMAIL,
        role: 'superadmin',
        name: 'Super Admin',
        position: 'Administrator',
        status: 'active',
        passwordHash
      };

      await User.updateOne({ id: SUPERADMIN_ID }, { $set: superuser }, { upsert: true });
      console.log('Superadmin ensured:', SUPERADMIN_EMAIL, 'id=' + SUPERADMIN_ID);
      console.log('If this is a production deployment, change SUPERADMIN_PASSWORD immediately.');
    } catch (err) {
      console.warn('Failed to create superadmin:', err && err.message);
    }

    console.log('Seed completed');
    process.exit(0);
  } catch (e) {
    console.error('Seed failed:', e && e.message);
    process.exit(1);
  }
}

seed();
