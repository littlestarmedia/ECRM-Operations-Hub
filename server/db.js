const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. This app has no local-storage or in-memory fallback for ' +
    'shared data — copy .env.example to .env and point it at a real Postgres database.'
  );
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
