/*
Node script to import CSV files from server/csv/ into Postgres.
Usage:
  set DATABASE_URL=postgresql://postgres:YOUR_PASS@...  (Windows CMD)
  $env:DATABASE_URL = 'postgresql://postgres:YOUR_PASS@...' (PowerShell)
  node scripts/import-csv-to-postgres.js

The script expects CSV files in server/csv/: users.csv, vehicles.csv, drivers.csv, trips.csv, requests.csv
It maps CSV headers (camelCase) to snake_case SQL columns and performs INSERT ... ON CONFLICT DO NOTHING.
*/

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Please set DATABASE_URL environment variable to your Postgres connection string.');
  process.exit(1);
}

const client = new Client({ connectionString: DATABASE_URL });

function splitCsvLine(line) {
  // split on commas not inside quotes
  return line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(s => s.trim());
}

function stripQuotes(s) {
  if (s === undefined || s === null) return null;
  s = s.trim();
  if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1);
  return s === '' ? null : s;
}

function toSnakeCase(h) {
  return h.replace(/([A-Z])/g, '_$1').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
}

async function importFile(filename, tableName) {
  const filePath = path.join(__dirname, '..', 'server', 'csv', filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}, skipping ${tableName}`);
    return;
  }
  const txt = fs.readFileSync(filePath, 'utf8').trim();
  if (!txt) return;
  const lines = txt.split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(lines.shift()).map(h => stripQuotes(h)).map(h => toSnakeCase(h));
  console.log(`Importing ${lines.length} rows into ${tableName} (columns: ${headers.join(',')})`);

  for (const line of lines) {
    const cols = splitCsvLine(line).map(c => stripQuotes(c));
    const row = {};
    headers.forEach((h, i) => row[h] = cols[i] === undefined ? null : cols[i]);

    // Build insert
    const keys = Object.keys(row).filter(k => row[k] !== undefined);
    const vals = keys.map(k => row[k]);
    if (keys.length === 0) continue;
    const colNames = keys.join(',');
    const placeholders = keys.map((_, i) => `$${i+1}`).join(',');

    const sql = `INSERT INTO ${tableName}(${colNames}) VALUES(${placeholders}) ON CONFLICT DO NOTHING`;
    try {
      await client.query(sql, vals);
    } catch (err) {
      console.error(`Insert failed for table ${tableName} row:`, row, err.message || err);
    }
  }
}

async function run() {
  try {
    await client.connect();
    // Order: users, vehicles, drivers, trips, requests
    await importFile('users.csv', 'users');
    await importFile('vehicles.csv', 'vehicles');
    await importFile('drivers.csv', 'drivers');
    await importFile('trips.csv', 'trips');
    await importFile('requests.csv', 'requests');
    console.log('Import finished');
  } catch (e) {
    console.error('Migration failed:', e);
  } finally {
    await client.end();
  }
}

run();
