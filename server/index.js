// Express server with MongoDB (mongoose) CRUD endpoints
const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const { connectMongo } = require('./lib/mongoose');
const Vehicle = require('./models/Vehicle');
const Driver = require('./models/Driver');
const User = require('./models/User');
const Trip = require('./models/Trip');
const Request = require('./models/Request');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function requireAuth(req, res, next) {
  const auth = req.headers && req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'Unauthorized' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ message: 'Unauthorized' });
  try {
    const payload = jwt.verify(parts[1], JWT_SECRET);
    req.user = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve uploads statically
const UPLOADS_DIR = path.join(__dirname, 'uploads');
try { if (!require('fs').existsSync(UPLOADS_DIR)) require('fs').mkdirSync(UPLOADS_DIR); } catch (e) { console.warn('Uploads dir:', e && e.message); }
app.use('/uploads', express.static(UPLOADS_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${path.extname(file.originalname) || '.bin'}`),
});
const upload = multer({ storage });

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Vehicles CRUD
app.get('/api/vehicles', async (req, res) => {
  try {
    const items = await Vehicle.find().sort({ id: 1 }).lean();
    res.json(items);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/vehicles/:id', async (req, res) => {
  try {
    const it = await Vehicle.findOne({ id: req.params.id }).lean();
    if (!it) return res.status(404).json({ message: 'Not found' });
    res.json(it);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post('/api/vehicles', async (req, res) => {
  try {
    const payload = req.body || {};
    payload.id = payload.id || String(Date.now());
    const doc = await Vehicle.create(payload);
    res.status(201).json(doc);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.put('/api/vehicles/:id', async (req, res) => {
  try {
    const doc = await Vehicle.findOneAndUpdate({ id: req.params.id }, req.body, { new: true }).lean();
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.delete('/api/vehicles/:id', async (req, res) => {
  try {
    await Vehicle.deleteOne({ id: req.params.id });
    res.status(204).send();
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Drivers CRUD
app.get('/api/drivers', async (req, res) => { try { res.json(await Driver.find().lean()); } catch (e) { res.status(500).json({ message: e.message }); }});
app.get('/api/drivers/:id', async (req, res) => { try { const it = await Driver.findOne({ id: req.params.id }).lean(); if(!it) return res.status(404).json({message:'Not found'}); res.json(it);} catch(e){res.status(500).json({message:e.message})}});
app.post('/api/drivers', async (req, res) => { try { const item = req.body || {}; item.id = item.id || String(Date.now()); const doc = await Driver.create(item); res.status(201).json(doc);}catch(e){res.status(500).json({message:e.message})}});
app.put('/api/drivers/:id', async (req, res) => { try { const doc = await Driver.findOneAndUpdate({id:req.params.id}, req.body, {new:true}).lean(); if(!doc) return res.status(404).json({message:'Not found'}); res.json(doc);}catch(e){res.status(500).json({message:e.message})}});
app.delete('/api/drivers/:id', async (req, res) => { try { await Driver.deleteOne({id:req.params.id}); res.status(204).send(); }catch(e){res.status(500).json({message:e.message})}});

// Users CRUD
app.get('/api/users', async (req, res) => { try { res.json(await User.find().lean()); } catch (e) { res.status(500).json({ message: e.message }); }});
app.get('/api/users/:id', async (req, res) => { try { const it = await User.findOne({ id: req.params.id }).lean(); if(!it) return res.status(404).json({message:'Not found'}); res.json(it);} catch (e){res.status(500).json({message:e.message})}});
app.post('/api/users', async (req, res) => { try { const item = req.body||{}; item.id = item.id||String(Date.now()); const doc = await User.create(item); res.status(201).json(doc);}catch(e){res.status(500).json({message:e.message})}});
app.put('/api/users/:id', async (req, res) => { try { const doc = await User.findOneAndUpdate({id:req.params.id}, req.body, {new:true}).lean(); if(!doc) return res.status(404).json({message:'Not found'}); res.json(doc);}catch(e){res.status(500).json({message:e.message})}});
app.delete('/api/users/:id', async (req, res) => { try { await User.deleteOne({id:req.params.id}); res.status(204).send(); }catch(e){res.status(500).json({message:e.message})}});

// Trips CRUD
app.get('/api/trips', async (req, res) => { try { res.json(await Trip.find().lean()); } catch (e) { res.status(500).json({ message: e.message }); }});
app.get('/api/trips/:id', async (req, res) => { try { const it = await Trip.findOne({ id: req.params.id }).lean(); if(!it) return res.status(404).json({message:'Not found'}); res.json(it);} catch (e){res.status(500).json({message:e.message})}});
app.post('/api/trips', async (req, res) => { try { const item = req.body||{}; item.id = item.id||String(Date.now()); if(item.date) item.date = new Date(item.date); const doc = await Trip.create(item); res.status(201).json(doc);}catch(e){res.status(500).json({message:e.message})}});
app.put('/api/trips/:id', async (req, res) => { try { if(req.body.date) req.body.date = new Date(req.body.date); const doc = await Trip.findOneAndUpdate({id:req.params.id}, req.body, {new:true}).lean(); if(!doc) return res.status(404).json({message:'Not found'}); res.json(doc);}catch(e){res.status(500).json({message:e.message})}});
app.delete('/api/trips/:id', async (req, res) => { try { await Trip.deleteOne({id:req.params.id}); res.status(204).send(); }catch(e){res.status(500).json({message:e.message})}});

// Requests CRUD
app.get('/api/requests', async (req, res) => { try { res.json(await Request.find().lean()); } catch (e) { res.status(500).json({ message: e.message }); }});
app.get('/api/requests/:id', async (req, res) => { try { const it = await Request.findOne({ id: req.params.id }).lean(); if(!it) return res.status(404).json({message:'Not found'}); res.json(it);} catch (e){res.status(500).json({message:e.message})}});
app.post('/api/requests', async (req, res) => { 
  try { 
    const item = req.body||{}; 
    item.id = item.id||String(Date.now()); 
    if(item.departAt) item.departAt = new Date(item.departAt); 
    if(item.arriveAt) item.arriveAt = new Date(item.arriveAt); 
    item.createdAt = item.createdAt ? new Date(item.createdAt) : new Date();
    item.status = item.status || 'planned';
    const doc = await Request.create(item); 
    res.status(201).json(doc);
  }catch(e){
    res.status(500).json({message:e.message})
  }
});
app.put('/api/requests/:id', async (req, res) => { 
  try { 
    if(req.body.departAt) req.body.departAt = new Date(req.body.departAt); 
    if(req.body.arriveAt) req.body.arriveAt = new Date(req.body.arriveAt);
    if(req.body.createdAt) req.body.createdAt = new Date(req.body.createdAt); 
    
    const oldDoc = await Request.findOne({id:req.params.id}).lean();
    if(!oldDoc) return res.status(404).json({message:'Not found'});
    
    const doc = await Request.findOneAndUpdate({id:req.params.id}, req.body, {new:true}).lean(); 
    
    // Якщо статус змінився на 'done', створюємо Trip та оновлюємо пробіг авто
    if (oldDoc.status !== 'done' && req.body.status === 'done' && doc.kilometers) {
      console.log(`Creating trip for request ${doc.id}, kilometers: ${doc.kilometers}`);
      const tripItem = {
        id: String(Date.now()),
        driverId: doc.driverId,
        vehicleId: doc.vehicleId,
        date: doc.departAt || new Date(),
        distanceKm: doc.kilometers,
        notes: `${doc.from} → ${doc.to}`
      };
      await Trip.create(tripItem);
      
      // Оновлюємо пробіг автомобіля
      const vehicle = await Vehicle.findOne({id: doc.vehicleId}).lean();
      if (vehicle) {
        const newMileage = (vehicle.mileage || 0) + doc.kilometers;
        console.log(`Updating vehicle ${vehicle.id} mileage from ${vehicle.mileage || 0} to ${newMileage}`);
        await Vehicle.findOneAndUpdate({id: doc.vehicleId}, {mileage: newMileage});
      }
    }
    
    res.json(doc);
  } catch(e) {
    res.status(500).json({message:e.message})
  }
});
app.delete('/api/requests/:id', async (req, res) => { try { await Request.deleteOne({id:req.params.id}); res.status(204).send(); }catch(e){res.status(500).json({message:e.message})}});

// Auth: login / register
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    const user = await User.findOne({ email }).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.status && user.status !== 'active') return res.status(403).json({ message: 'Account not active' });
    const ok = await bcrypt.compare(password, user.passwordHash || '');
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = signToken(user);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, position: user.position } });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, position } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    const existing = await User.findOne({ email }).lean();
    if (existing) return res.status(409).json({ message: 'User already exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const id = String(Date.now());
    const u = await User.create({ id, email, name, position, role: 'user', status: 'pending', passwordHash });
    const token = signToken(u);
    res.status(201).json({ token, user: { id: u.id, email: u.email, name: u.name, role: u.role, position: u.position } });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Me endpoints
app.get('/api/me', requireAuth, async (req, res) => {
  try {
    const u = await User.findOne({ id: req.user.id }).lean();
    if (!u) return res.status(404).json({ message: 'Not found' });
    res.json({ id: u.id, email: u.email, name: u.name, role: u.role, position: u.position });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.put('/api/me', requireAuth, async (req, res) => {
  try {
    const payload = {};
    if (req.body.email) payload.email = req.body.email;
    if (req.body.name) payload.name = req.body.name;
    if (req.body.position) payload.position = req.body.position;
    if (req.body.password) payload.passwordHash = await bcrypt.hash(req.body.password, 10);
    const doc = await User.findOneAndUpdate({ id: req.user.id }, payload, { new: true }).lean();
    if (!doc) return res.status(404).json({ message: 'Not found' });
    const token = signToken(doc);
    res.json({ token, user: { id: doc.id, email: doc.email, name: doc.name, role: doc.role, position: doc.position } });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Registrations & approval (admin)
app.get('/api/registrations', async (req, res) => {
  try { const pending = await User.find({ status: 'pending' }).lean(); res.json(pending); } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post('/api/users/:id/approve', requireAuth, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) return res.status(403).json({ message: 'Forbidden' });
    const doc = await User.findOneAndUpdate({ id: req.params.id }, { status: 'active' }, { new: true }).lean();
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json({ id: doc.id, email: doc.email, name: doc.name, role: doc.role, position: doc.position });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post('/api/users/:id/reject', requireAuth, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) return res.status(403).json({ message: 'Forbidden' });
    const doc = await User.findOneAndUpdate({ id: req.params.id }, { status: 'rejected' }, { new: true }).lean();
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json({ id: doc.id, email: doc.email, name: doc.name, role: doc.role, position: doc.position });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// fallback for unknown API
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ message: 'Not found' });
  next();
});

async function start() {
  try {
    await connectMongo();
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (e) {
    console.error('Failed to start server, mongo connect error:', e && e.message);
    process.exit(1);
  }
}

if (require.main === module) start();
module.exports = app;
