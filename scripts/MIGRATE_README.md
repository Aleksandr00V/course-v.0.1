Migration notes

1) Set your DATABASE_URL environment variable (PowerShell example):

$env:DATABASE_URL = 'postgresql://postgres:YOUR_PASSWORD@db.zcydelavbubbfdkxvntu.supabase.co:5432/postgres'

2) (Optional) Run SQL schema to create tables and indexes. In Supabase SQL Editor paste contents of `server/sql/schema.sql` and execute.

3) Install dependencies for importer script:

cd e:\pz\course-v.0.1
npm install pg

4) Run the importer script:

node scripts/import-csv-to-postgres.js

Notes:
- The script maps CSV headers to snake_case SQL columns.
- It uses `INSERT ... ON CONFLICT DO NOTHING` to avoid duplicates.
- Do NOT commit secrets to source control. Use environment variables. After migration consider rotating credentials.
