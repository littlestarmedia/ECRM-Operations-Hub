const fs = require('fs');
const path = require('path');
const db = require('../server/db');

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
  await db.query(sql);
  console.log('Schema applied.');
  await db.pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
