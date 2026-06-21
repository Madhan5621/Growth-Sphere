// db/pool.js
// Postgres connection pool to Supabase, using the `pg` package directly.
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('[db] DATABASE_URL is not set. Add it to your .env file or Vercel project settings.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase's pooled connection requires SSL. rejectUnauthorized:false is the
  // standard setting for Supabase's managed certs in serverless environments.
  ssl: { rejectUnauthorized: false },
  max: 5, // keep low — serverless functions spin up many short-lived instances
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[db] Unexpected error on idle client', err);
});

module.exports = pool;
