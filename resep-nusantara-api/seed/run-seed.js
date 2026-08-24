require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

async function run() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');

  console.log('Menjalankan schema.sql...');
  await pool.query(schema);

  console.log('Menjalankan seed.sql...');
  await pool.query(seed);

  console.log('Selesai. Database sudah terisi.');
  await pool.end();
}

run().catch((err) => {
  console.error('Gagal menjalankan seed:', err);
  process.exit(1);
});
