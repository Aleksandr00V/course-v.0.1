#!/usr/bin/env node
/*
  Usage:
    Set env: MONGODB_URI and optionally SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD, SUPERADMIN_ID
    node scripts/create-superadmin.js
*/
const { connectMongo } = require('../server/lib/mongoose');
const bcrypt = require('bcryptjs');

async function run() {
  try {
    await connectMongo();
    const User = require('../server/models/User');

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
    console.log('Superadmin created/updated:', SUPERADMIN_EMAIL, 'id=' + SUPERADMIN_ID);
    process.exit(0);
  } catch (e) {
    console.error('Failed to create superadmin:', e && e.message);
    process.exit(1);
  }
}

run();
