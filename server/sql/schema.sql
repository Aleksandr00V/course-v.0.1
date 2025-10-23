-- SQL schema for course-v.0.1
-- Run this on your Postgres (Supabase) to create tables.

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text UNIQUE,
  role text,
  position text,
  password_hash text,
  name text,
  status text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vehicles (
  id text PRIMARY KEY,
  make text,
  model text,
  type text,
  status text,
  assigned_unit text,
  vin text,
  registration_number text UNIQUE,
  year integer,
  mileage integer,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS drivers (
  id text PRIMARY KEY,
  first_name text,
  last_name text,
  full_name text,
  license_number text,
  rank text,
  phone text,
  notes text,
  fixed_speed integer,
  distance integer,
  user_id text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trips (
  id text PRIMARY KEY,
  driver_id text REFERENCES drivers(id) ON DELETE RESTRICT,
  vehicle_id text REFERENCES vehicles(id) ON DELETE RESTRICT,
  date timestamptz,
  distance_km numeric,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS requests (
  id text PRIMARY KEY,
  vehicle_id text REFERENCES vehicles(id) ON DELETE RESTRICT,
  driver_id text REFERENCES drivers(id) ON DELETE RESTRICT,
  from_location text,
  to_location text,
  depart_at timestamptz,
  status text,
  notes text,
  created_at timestamptz
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips (driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle ON trips (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_requests_driver ON requests (driver_id);
CREATE INDEX IF NOT EXISTS idx_requests_vehicle ON requests (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);

-- Note: column names use snake_case. CSV importer maps headers to snake_case columns.
