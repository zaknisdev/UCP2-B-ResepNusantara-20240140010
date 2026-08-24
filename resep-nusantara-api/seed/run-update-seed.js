require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

async function run() {
  const updateSeed = fs.readFileSync(path.join(__dirname, 'updateseed.sql'), 'utf-8');

  console.log('Menjalankan updateseed.sql...');
  const result = await pool.query(updateSeed);

  console.log('Selesai. updateseed.sql sudah diterapkan.');
  await pool.end();
}

run().catch((err) => {
  console.error('Gagal menjalankan updateseed:', err);
  process.exit(1);
});
