const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const DB_PATH = path.join(__dirname, 'db.json');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-me';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

app.use(cors());
app.use(express.json());
// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer setup for file uploads
const UPLOADS_DIR = path.join(__dirname, 'uploads');
let uploadsEnabled = true;
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
  }
} catch (e) {
  // If we cannot create uploads (serverless read-only fs), disable upload handling
  console.warn('Uploads disabled: cannot create uploads directory:', e && e.message);
  uploadsEnabled = false;
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.bin';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({ storage });

// Helper to sanitize any stray control characters used as arrows in notes
function sanitizeArrows(text) {
  try {
    return String(text)
      // replace control-char + '2' (e.g., \x19 2) with a proper arrow
      .replace(/[\x00-\x1F]2/g, ' → ')
      // also normalize ASCII arrow to unicode arrow for consistency
      .replace(/\s->\s/g, ' → ');
  } catch {
    return text;
  }
}

function migrateToVehicles(db) {
  if (db.vehicles && Array.isArray(db.vehicles)) return db;
  if (db.equipment && Array.isArray(db.equipment)) {
    const vehicles = db.equipment.map((e) => ({
      id: e.id || Date.now().toString(),
      make: e.make || '',
      model: e.name || '',
      type: e.category || '',
      status: e.status === 'repair' ? 'repair' : e.status === 'available' || e.status === 'in-use' ? 'in-service' : 'decommissioned',
      assignedUnit: e.owner || '',
      vin: e.serial || '',
      registrationNumber: e.registrationNumber || '',
      year: e.year || '',
      mileage: e.mileage || 0,
      notes: e.notes || '',
    }));
    return { vehicles, drivers: db.drivers || [], users: db.users || [] };
  }
  return { vehicles: [], drivers: db.drivers || [], users: db.users || [] };
}

// If running in a serverless environment the FS can be read-only. Use an in-memory
// fallback DB when writes fail.
let inMemoryDb = null;
let readOnlyFs = false;

function readDb() {
  try {
    if (readOnlyFs && inMemoryDb) {
      return migrateToVehicles(inMemoryDb);
    }
    if (!fs.existsSync(DB_PATH)) {
      try {
        fs.writeFileSync(DB_PATH, JSON.stringify({ vehicles: [] }, null, 2));
      } catch (e) {
        // cannot write to disk, switch to in-memory
        console.warn('Cannot initialize DB on disk, switching to in-memory DB:', e && e.message);
        readOnlyFs = true;
        inMemoryDb = { vehicles: [] };
        return migrateToVehicles(inMemoryDb);
      }
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw || '{"vehicles": [], "drivers": [], "users": []}');
    return migrateToVehicles(parsed);
  } catch (e) {
    console.warn('Failed to read DB from disk, using in-memory DB:', e && e.message);
    readOnlyFs = true;
    inMemoryDb = inMemoryDb || { vehicles: [], drivers: [], users: [] };
    return migrateToVehicles(inMemoryDb);
  }
}

function writeDb(data) {
  try {
    if (readOnlyFs) {
      inMemoryDb = data;
      return;
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.warn('Failed to write DB to disk, switching to in-memory DB:', e && e.message);
    readOnlyFs = true;
    inMemoryDb = data;
  }
}

function ensureSeedUser() {
  const db = readDb();
  db.users = db.users || [];
  const hasSuper = db.users.some((u) => u.role === 'superadmin');
  if (hasSuper) return;
  // if user with email admin@local exists, promote to superadmin (no duplicate)
  const adminEmail = 'admin@local';
  const idx = db.users.findIndex((u) => (u.email || '').toLowerCase() === adminEmail);
  if (idx !== -1) {
    db.users[idx].role = 'superadmin';
    writeDb(db);
    console.log('Promoted existing admin@local to superadmin');
    return;
  }
  const passwordHash = bcrypt.hashSync('admin123', 10);
  db.users.push({
    id: Date.now().toString(),
    email: adminEmail,
    role: 'superadmin',
    passwordHash,
    name: 'Адміністратор',
  });
  writeDb(db);
  console.log('Seeded default superadmin: admin@local / admin123');
}
ensureSeedUser();

// Ensure unique users by email (case-insensitive) and normalize to lowercase
function ensureUsersUnique() {
  const db = readDb();
  const users = db.users || [];
  const roleRank = { user: 1, admin: 2, superadmin: 3 };
  const map = new Map();
  let changed = false;
  for (const u of users) {
    const email = (u.email || '').toLowerCase();
    if (email !== u.email) changed = true;
    const existing = map.get(email);
    if (!existing) {
      map.set(email, { ...u, email });
    } else {
      // Keep higher role; if equal, keep the first
      const keep = roleRank[existing.role] >= roleRank[u.role] ? existing : { ...u, email };
      if (keep !== existing) changed = true;
      map.set(email, keep);
    }
  }
  if (changed || map.size !== users.length) {
    db.users = Array.from(map.values());
    writeDb(db);
    console.log('Normalized users: emails lowercased, duplicates merged');
  }
}
ensureUsersUnique();

// Ensure each user has a status: 'active' | 'pending' | 'rejected'
function ensureUsersStatus() {
  const db = readDb();
  const users = db.users || [];
  let changed = false;
  for (const u of users) {
    if (!u.status) {
      // Existing users default to 'active'
      u.status = 'active';
      changed = true;
    }
  }
  if (changed) {
    writeDb(db);
    console.log('Normalized users: added default status=active');
  }
}
ensureUsersStatus();

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function requireAuth(allowedRoles = []) {
  return (req, res, next) => {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      next();
    } catch (e) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  };
}

// Health
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Ensure trips array exists
function ensureTripsArray() {
  const db = readDb();
  if (!Array.isArray(db.trips)) {
    db.trips = [];
    writeDb(db);
  }
}
ensureTripsArray();

// Ensure requests array exists
function ensureRequestsArray() {
  const db = readDb();
  if (!Array.isArray(db.requests)) {
    db.requests = [];
    writeDb(db);
  }
}
ensureRequestsArray();

// One-time migration to clean up any bad arrow characters in trip notes
function ensureTripsNotesClean() {
  const db = readDb();
  let changed = false;
  if (Array.isArray(db.trips)) {
    db.trips = db.trips.map((t) => {
      const nextNotes = sanitizeArrows(t.notes || '');
      if (nextNotes !== (t.notes || '')) {
        changed = true;
        return { ...t, notes: nextNotes };
      }
      return t;
    });
  }
  if (changed) {
    writeDb(db);
    console.log('Sanitized trip notes arrows');
  }
}
ensureTripsNotesClean();

// Seed a few vehicles if none exist
function ensureSeedVehicles() {
  const db = readDb();
  if (!Array.isArray(db.vehicles) || db.vehicles.length > 0) return;
  const now = Date.now();
  db.vehicles = [
    { id: String(now), make: 'КрАЗ', model: '6322', type: 'вантажівка', status: 'base', assignedUnit: 'Рота забезпечення', vin: 'KRAZ-6322-0001', registrationNumber: 'ВЧ-1234', year: 2018, mileage: 32500, notes: '' },
    { id: String(now + 1), make: 'ЗІЛ', model: '131', type: 'вантажівка', status: 'base', assignedUnit: 'Рота забезпечення', vin: 'ZIL-131-0002', registrationNumber: 'ВЧ-2234', year: 1990, mileage: 120000, notes: '' },
    { id: String(now + 2), make: 'УАЗ', model: '469', type: 'позашляховик', status: 'base', assignedUnit: 'Штаб', vin: 'UAZ-469-0003', registrationNumber: 'ВЧ-3234', year: 1985, mileage: 80000, notes: '' },
  ];
  writeDb(db);
  console.log('Seeded sample vehicles');
}
ensureSeedVehicles();

// Auth
app.post('/api/auth/register', (req, res) => {
  let { email, password, lastName, firstName, middleName, position } = req.body || {};
  if (!email || !password || !lastName || !firstName || !middleName || !position) {
    return res.status(400).json({ message: 'All fields are required: email, password, lastName, firstName, middleName, position' });
  }
  email = String(email).trim().toLowerCase();
  const db = readDb();
  const exists = (db.users || []).some((u) => (u.email || '').toLowerCase() === email);
  if (exists) return res.status(409).json({ message: 'User already exists' });
  const passwordHash = bcrypt.hashSync(password, 10);
  const name = `${lastName} ${firstName} ${middleName}`.trim();
  const user = { id: Date.now().toString(), email, name, role: 'user', position, status: 'pending', passwordHash };
  db.users.push(user);
  writeDb(db);
  res.status(201).json({ ok: true, status: 'pending', user: { id: user.id, email: user.email, role: user.role, name: user.name, position: user.position } });
});

app.post('/api/auth/login', (req, res) => {
  let { email, password } = req.body || {};
  const db = readDb();
  email = String(email || '').toLowerCase();
  const user = (db.users || []).find((u) => (u.email || '').toLowerCase() === email);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = bcrypt.compareSync(password || '', user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  if (user.status && user.status !== 'active') {
    if (user.status === 'pending') return res.status(403).json({ message: 'Account pending approval' });
    if (user.status === 'rejected') return res.status(403).json({ message: 'Account rejected' });
  }
  const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
});

// Self profile
app.get('/api/me', requireAuth(), (req, res) => {
  const db = readDb();
  const user = (db.users || []).find((u) => u.id == req.user.id);
  if (!user) return res.status(404).json({ message: 'Not found' });
  const { passwordHash, ...safe } = user;
  res.json(safe);
});

app.put('/api/me', requireAuth(), (req, res) => {
  const db = readDb();
  const idx = (db.users || []).findIndex((u) => u.id == req.user.id);
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  const { email, name, password } = req.body || {};
  const update = { ...db.users[idx] };
  if (typeof name !== 'undefined') update.name = name;
  if (email) {
    const lower = String(email).trim().toLowerCase();
    const conflict = (db.users || []).some((u) => u.id != req.user.id && (u.email || '').toLowerCase() === lower);
    if (conflict) return res.status(409).json({ message: 'Email already in use' });
    update.email = lower;
  }
  if (password) update.passwordHash = bcrypt.hashSync(password, 10);
  db.users[idx] = update;
  writeDb(db);
  // return new token to reflect potential email/name changes
  const token = signToken({ id: update.id, email: update.email, role: update.role, name: update.name });
  const { passwordHash, ...safe } = update;
  res.json({ token, user: safe });
});

// Pending registrations for admin/superadmin
app.get('/api/registrations', requireAuth(['admin', 'superadmin']), (req, res) => {
  const db = readDb();
  const pending = (db.users || []).filter((u) => u.status === 'pending').map(({ passwordHash, ...u }) => u);
  res.json(pending);
});

app.post('/api/users/:id/approve', requireAuth(['admin', 'superadmin']), (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const idx = (db.users || []).findIndex((u) => u.id == id);
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  db.users[idx].status = 'active';
  writeDb(db);
  const { passwordHash, ...safe } = db.users[idx];
  res.json(safe);
});

app.post('/api/users/:id/reject', requireAuth(['admin', 'superadmin']), (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const idx = (db.users || []).findIndex((u) => u.id == id);
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  db.users[idx].status = 'rejected';
  writeDb(db);
  const { passwordHash, ...safe } = db.users[idx];
  res.json(safe);
});

// Users management (superadmin only)
app.get('/api/users', requireAuth(['superadmin']), (req, res) => {
  const db = readDb();
  const users = (db.users || []).map(({ passwordHash, ...u }) => u);
  res.json(users);
});

app.post('/api/users', requireAuth(['superadmin']), (req, res) => {
  const { email, lastName, firstName, middleName, role, password } = req.body;
  const db = readDb();

  if (db.users.some((u) => u.email === email)) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const newUser = {
    id: Date.now().toString(),
    email,
    lastName,
    firstName,
    middleName,
    role: role || 'user',
    status: 'active',
    passwordHash,
    createdAt: Date.now() // Unix Time in milliseconds
  };

  db.users.push(newUser);
  writeDb(db);

  res.status(201).json({ message: 'User created successfully', user: newUser });
});

app.put('/api/users/:id', requireAuth(['superadmin']), (req, res) => {
  const { id } = req.params;
  let { email, name, role, password } = req.body || {};
  const db = readDb();
  const idx = (db.users || []).findIndex((u) => u.id == id);
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  if (role && !['user', 'admin', 'superadmin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
  const update = { ...db.users[idx] };
  if (email) {
    email = String(email).trim().toLowerCase();
    const conflict = (db.users || []).some((u) => u.id != id && (u.email || '').toLowerCase() === email);
    if (conflict) return res.status(409).json({ message: 'Email already in use' });
    update.email = email;
  }
  if (typeof name !== 'undefined') update.name = name;
  if (role) update.role = role;
  if (password) update.passwordHash = bcrypt.hashSync(password, 10);
  db.users[idx] = update;
  writeDb(db);
  const { passwordHash, ...safe } = db.users[idx];
  res.json(safe);
});

app.delete('/api/users/:id', requireAuth(['superadmin']), (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const list = db.users || [];
  const idx = list.findIndex((u) => u.id == id);
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  // Prevent self-delete for current superadmin
  if (req.user && String(req.user.id) === String(id)) return res.status(400).json({ message: 'You cannot delete yourself' });
  // Prevent deleting last superadmin
  const deleting = list[idx];
  if (deleting.role === 'superadmin') {
    const superCount = list.filter((u) => u.role === 'superadmin').length;
    if (superCount <= 1) return res.status(400).json({ message: 'Cannot delete the last superadmin' });
  }
  db.users = list.filter((u) => u.id != id);
  writeDb(db);
  res.status(204).send();
});

// Update user role and position (superadmin only)
function updateUserRole(req, res) {
  const { userId, newRole, newPosition } = req.body;
  const db = readDb();
  const user = db.users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (!['Водій', 'Старший Водій', 'Механік водій', 'Начальник автослужби', 'Старший технік автопарку'].includes(newPosition)) {
    return res.status(400).json({ message: 'Invalid position' });
  }

  user.role = newRole;
  user.position = newPosition;
  writeDb(db);

  res.json({ message: 'User role and position updated successfully', user });
}

app.put('/api/users/:id/role', requireAuth(['superadmin']), updateUserRole);

// List vehicles
app.get('/api/vehicles', (req, res) => {
  const db = readDb();
  res.json(db.vehicles || []);
});

app.get('/api/vehicles/:id', (req, res) => {
  const db = readDb();
  const it = (db.vehicles || []).find((v) => v.id == req.params.id);
  if (!it) return res.status(404).json({ message: 'Not found' });
  res.json(it);
});

// Create vehicle
app.post('/api/vehicles', requireAuth(['admin', 'superadmin']), (req, res) => {
  const db = readDb();
  const item = req.body || {};
  if (!item.make || !item.model || !item.registrationNumber) {
    return res.status(400).json({ message: 'make, model, registrationNumber are required' });
  }
  item.id = item.id || Date.now().toString();
  // Normalize status to our set: base | trip | repair
  const allowed = ['base', 'trip', 'repair'];
  const legacyMap = { 'in-service': 'base', 'decommissioned': 'base', repair: 'repair' };
  const rawStatus = item.status || 'base';
  const normalized = allowed.includes(rawStatus) ? rawStatus : (legacyMap[rawStatus] || 'base');
  item.status = normalized;
  db.vehicles.push(item);
  writeDb(db);
  res.status(201).json(item);
});

// Update vehicle
app.put('/api/vehicles/:id', requireAuth(['admin', 'superadmin']), (req, res) => {
  const { id } = req.params;
  const update = req.body || {};
  const db = readDb();
  const idx = (db.vehicles || []).findIndex((e) => e.id == id);
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  if (typeof update.status !== 'undefined') {
    const allowed = ['base', 'trip', 'repair'];
    const legacyMap = { 'in-service': 'base', 'decommissioned': 'base', repair: 'repair' };
    const rawStatus = update.status;
    update.status = allowed.includes(rawStatus) ? rawStatus : (legacyMap[rawStatus] || db.vehicles[idx].status || 'base');
  }
  db.vehicles[idx] = { ...db.vehicles[idx], ...update, id: db.vehicles[idx].id };
  writeDb(db);
  res.json(db.vehicles[idx]);
});

// Delete vehicle
app.delete('/api/vehicles/:id', requireAuth(['admin', 'superadmin']), (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const before = db.vehicles.length;
  db.vehicles = (db.vehicles || []).filter((e) => e.id != id);
  if (db.vehicles.length === before) return res.status(404).json({ message: 'Not found' });
  writeDb(db);
  res.status(204).send();
});

// Drivers CRUD
app.get('/api/drivers', (req, res) => {
  const db = readDb();
  const drivers = db.users
    .filter(user => user.position === 'Водій')
    .map(user => ({
      id: user.id,
      firstName: user.name.split(' ')[1] || '',
      lastName: user.name.split(' ')[0] || '',
      position: user.position,
      phone: user.phone || '',
      email: user.email
    }));
  res.json(drivers);
});

app.get('/api/drivers/:id', (req, res) => {
  const db = readDb();
  const it = (db.drivers || []).find((d) => d.id == req.params.id);
  if (!it) return res.status(404).json({ message: 'Not found' });
  res.json(it);
});

app.post('/api/drivers', requireAuth(['admin', 'superadmin']), (req, res) => {
  const db = readDb();
  const d = req.body || {};
  if (!d.firstName || !d.lastName || !d.licenseNumber) {
    return res.status(400).json({ message: 'firstName, lastName, licenseNumber are required' });
  }
  d.id = d.id || Date.now().toString();
  db.drivers = db.drivers || [];
  db.drivers.push(d);
  writeDb(db);
  res.status(201).json(d);
});

app.put('/api/drivers/:id', requireAuth(['admin', 'superadmin']), (req, res) => {
  const { id } = req.params;
  const update = req.body || {};
  const db = readDb();
  const idx = (db.drivers || []).findIndex((x) => x.id == id);
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  db.drivers[idx] = { ...db.drivers[idx], ...update, id: db.drivers[idx].id };
  writeDb(db);
  res.json(db.drivers[idx]);
});

app.delete('/api/drivers/:id', requireAuth(['admin', 'superadmin']), (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const list = db.drivers || [];
  const idx = list.findIndex((x) => x.id == id);
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  const removed = list[idx];
  // Attempt to delete associated photo file if exists
  if (removed && removed.photoUrl && typeof removed.photoUrl === 'string') {
    try {
      const filename = removed.photoUrl.startsWith('/uploads/') ? removed.photoUrl.replace('/uploads/', '') : null;
      if (filename) {
        const filePath = path.join(__dirname, 'uploads', filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    } catch {}
  }
  db.drivers = list.filter((x) => x.id != id);
  writeDb(db);
  res.status(204).send();
});

// Upload driver photo and attach URL to driver
app.post('/api/drivers/:id/photo', requireAuth(['admin', 'superadmin']), upload.single('photo'), (req, res) => {
  const { id } = req.params;
  if (!uploadsEnabled) return res.status(503).json({ message: 'Uploads not available in this environment' });
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const db = readDb();
  const idx = (db.drivers || []).findIndex((x) => x.id == id);
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  const fileUrl = `/uploads/${req.file.filename}`;
  db.drivers[idx] = { ...db.drivers[idx], photoUrl: fileUrl };
  writeDb(db);
  res.json({ photoUrl: fileUrl });
});

// Trips: { id, driverId, vehicleId, date, distanceKm, notes }
app.get('/api/trips', requireAuth(), (req, res) => {
  const { driverId, vehicleId } = req.query || {};
  const db = readDb();
  let trips = db.trips || [];
  if (driverId) trips = trips.filter((t) => String(t.driverId) === String(driverId));
  if (vehicleId) trips = trips.filter((t) => String(t.vehicleId) === String(vehicleId));
  res.json(trips);
});

app.post('/api/trips', requireAuth(['admin', 'superadmin']), (req, res) => {
  const { driverId, vehicleId, date, distanceKm, notes } = req.body || {};
  if (!driverId || !vehicleId || !distanceKm) return res.status(400).json({ message: 'driverId, vehicleId, distanceKm are required' });
  const db = readDb();
  const driver = (db.drivers || []).find((d) => d.id == driverId);
  const vehicle = (db.vehicles || []).find((v) => v.id == vehicleId);
  if (!driver || !vehicle) return res.status(400).json({ message: 'Invalid driver or vehicle' });
  const trip = {
    id: Date.now().toString(),
    driverId,
    vehicleId,
    date: date || new Date().toISOString(),
    distanceKm: Number(distanceKm),
    notes: notes || '',
  };
  db.trips = db.trips || [];
  db.trips.push(trip);
  writeDb(db);
  res.status(201).json(trip);
});

// Requests: planned dispatches { id, vehicleId, driverId, from, to, departAt, status, notes, createdAt }
app.get('/api/requests', requireAuth(), (req, res) => {
  const db = readDb();
  res.json(db.requests || []);
});

app.post('/api/requests', requireAuth(['admin', 'superadmin']), (req, res) => {
  const { vehicleId, driverId, from, to, departAt, notes } = req.body || {};
  if (!vehicleId || !driverId || !from || !to) return res.status(400).json({ message: 'vehicleId, driverId, from, to are required' });
  const db = readDb();
  const driver = (db.drivers || []).find((d) => d.id == driverId);
  const vehicle = (db.vehicles || []).find((v) => v.id == vehicleId);
  if (!driver || !vehicle) return res.status(400).json({ message: 'Invalid driver or vehicle' });
  const reqItem = {
    id: Date.now().toString(),
    vehicleId,
    driverId,
    from: String(from),
    to: String(to),
    departAt: departAt || new Date().toISOString(),
    status: 'planned',
    notes: notes || '',
    createdAt: new Date().toISOString(),
  };
  db.requests = db.requests || [];
  db.requests.push(reqItem);
  writeDb(db);
  res.status(201).json(reqItem);
});

app.put('/api/requests/:id', requireAuth(['admin', 'superadmin']), (req, res) => {
  const { id } = req.params;
  const { status, notes, from, to, departAt, driverId, vehicleId } = req.body || {};
  const db = readDb();
  const idx = (db.requests || []).findIndex((r) => r.id == id);
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  const allowedStatus = ['planned', 'in-progress', 'done', 'canceled'];
  const prev = { ...db.requests[idx] };
  const update = { ...prev };
  if (status) {
    if (!allowedStatus.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    update.status = status;
  }
  if (typeof notes !== 'undefined') update.notes = String(notes);
  if (typeof from !== 'undefined') update.from = String(from);
  if (typeof to !== 'undefined') update.to = String(to);
  if (typeof departAt !== 'undefined') update.departAt = String(departAt);
  if (typeof driverId !== 'undefined') update.driverId = String(driverId);
  if (typeof vehicleId !== 'undefined') update.vehicleId = String(vehicleId);
  // Side-effects: when request starts, set vehicle to 'trip' and log a trip; when finishes/cancels, set vehicle back to 'base'
  try {
    // Ensure arrays exist
    db.trips = db.trips || [];
    db.vehicles = db.vehicles || [];

    const vIdx = db.vehicles.findIndex((v) => String(v.id) === String(update.vehicleId));
    const dExists = (db.drivers || []).some((d) => String(d.id) === String(update.driverId));
    const vehicle = vIdx !== -1 ? db.vehicles[vIdx] : null;

    const prevStatus = prev.status;
    const nextStatus = update.status;

    // Transition to in-progress: mark vehicle as on trip and create a 0-km trip log for departure
    if (nextStatus === 'in-progress' && prevStatus !== 'in-progress') {
      if (vehicle) {
        db.vehicles[vIdx] = { ...vehicle, status: 'trip' };
      }
      if (vehicle && dExists) {
        db.trips.push({
          id: Date.now().toString(),
          driverId: String(update.driverId),
          vehicleId: String(update.vehicleId),
          date: update.departAt || new Date().toISOString(),
          distanceKm: 0,
          notes: `[dispatch] старт: ${update.from} -> ${update.to} (request #${update.id})`,
        });
        // sanitize the just-added note
        const _i = db.trips.length - 1;
        db.trips[_i].notes = sanitizeArrows(db.trips[_i].notes);
      }
    }

    // Transition to done/canceled: if vehicle is on trip, return it to base
    if ((nextStatus === 'done' || nextStatus === 'canceled') && vehicle && vehicle.status === 'trip') {
      db.vehicles[vIdx] = { ...vehicle, status: 'base' };
      if (dExists) {
        db.trips.push({
          id: (Date.now() + 1).toString(),
          driverId: String(update.driverId),
          vehicleId: String(update.vehicleId),
          date: new Date().toISOString(),
          distanceKm: 0,
          notes: `[dispatch] завершено: ${update.from} -> ${update.to} (${nextStatus}) (request #${update.id})`,
        });
        const _j = db.trips.length - 1;
        db.trips[_j].notes = sanitizeArrows(db.trips[_j].notes);
      }
    }
  } catch (e) {
    // Log but do not block the main update
    console.error('Request side-effect failed:', e);
  }

  db.requests[idx] = update;
  writeDb(db);
  res.json(update);
});

app.delete('/api/requests/:id', requireAuth(['admin', 'superadmin']), (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const before = (db.requests || []).length;
  db.requests = (db.requests || []).filter((r) => r.id != id);
  if ((db.requests || []).length === before) return res.status(404).json({ message: 'Not found' });
  writeDb(db);
  res.status(204).send();
});

// If this file is run directly, start the HTTP server. Otherwise export the app
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
} else {
  module.exports = app;
}
