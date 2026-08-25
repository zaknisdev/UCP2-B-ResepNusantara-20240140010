// Isi kolom image_url untuk recipes & ingredients dengan hasil pencarian
// foto dari Unsplash API (https://api.unsplash.com/search/photos).
//
// Hanya UNSPLASH_ACCESS_KEY yang dipakai (header "Authorization: Client-ID
// <access_key>"), sesuai skema autentikasi publik Unsplash untuk endpoint
// search. Secret key tidak diperlukan di sini (hanya dipakai untuk alur
// OAuth pihak ketiga).
//
// Resumable: baris yang sudah punya image_url dilewati, jadi script ini
// aman dijalankan berkali-kali / dilanjut kalau sempat berhenti.
//
// Usage:
//   node seed/fetch-images.js [--type=recipes|ingredients|all] [--limit=N] [--delay=ms] [--dry-run]
//
// Rate limit akun Unsplash "Demo" adalah 50 request/jam. Default delay di
// bawah (4000ms) sengaja konservatif; naikkan --delay kalau akun masih
// demo dan ingin memastikan tidak kena limit dalam sekali jalan panjang.

require('dotenv').config();
const pool = require('../src/config/db');

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

function parseArgs() {
  const args = { type: 'all', limit: Infinity, delay: 4000, dryRun: false };
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--type=')) args.type = arg.split('=')[1];
    else if (arg.startsWith('--limit=')) args.limit = parseInt(arg.split('=')[1], 10);
    else if (arg.startsWith('--delay=')) args.delay = parseInt(arg.split('=')[1], 10);
    else if (arg === '--dry-run') args.dryRun = true;
  }
  return args;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function searchImage(query) {
  const url = new URL('https://api.unsplash.com/search/photos');
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', '1');

  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${ACCESS_KEY}` },
  });

  if (res.status === 403) {
    throw new Error('RATE_LIMITED');
  }
  if (!res.ok) {
    throw new Error(`Unsplash error ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();
  const first = json.results && json.results[0];
  return first ? first.urls.small : null;
}

async function fillTable({ table, nameColumn, queryPrefix, limit, delay, dryRun }) {
  const { rows } = await pool.query(
    `SELECT id, ${nameColumn} AS name FROM ${table} WHERE image_url IS NULL ORDER BY id ASC`
  );

  const todo = rows.slice(0, Math.min(limit, rows.length));
  console.log(`[${table}] ${rows.length} baris belum punya gambar, memproses ${todo.length}...`);

  let filled = 0;
  for (const row of todo) {
    // Coba nama spesifik dulu ("Soto Betawi"), baru fallback ke query
    // generik ("indonesian food") kalau tidak ada hasil sama sekali --
    // supaya tiap baris tetap kebagian gambar yang relevan.
    const candidates = [row.name, queryPrefix];
    let imageUrl = null;
    let rateLimited = false;

    for (const query of candidates) {
      try {
        imageUrl = await searchImage(query);
      } catch (err) {
        if (err.message === 'RATE_LIMITED') {
          rateLimited = true;
          break;
        }
        console.error(`[${table}] #${row.id} "${row.name}" gagal (query "${query}"): ${err.message}`);
      }
      if (imageUrl) break;
      await sleep(delay);
    }

    if (rateLimited) {
      console.warn(`[${table}] Kena rate limit Unsplash, berhenti di #${row.id}. Jalankan lagi nanti untuk lanjut.`);
      break;
    }

    if (imageUrl) {
      if (!dryRun) {
        await pool.query(`UPDATE ${table} SET image_url = $1 WHERE id = $2`, [imageUrl, row.id]);
      }
      filled += 1;
      console.log(`[${table}] #${row.id} "${row.name}" -> ${imageUrl}`);
    } else {
      console.log(`[${table}] #${row.id} "${row.name}" -> tidak ada hasil sama sekali, dilewati`);
    }

    await sleep(delay);
  }

  console.log(`[${table}] Selesai. ${filled}/${todo.length} baris terisi gambar baru.`);
}

async function main() {
  if (!ACCESS_KEY) {
    throw new Error('UNSPLASH_ACCESS_KEY belum diisi di .env');
  }

  const args = parseArgs();
  console.log('Opsi:', args);

  if (args.type === 'recipes' || args.type === 'all') {
    await fillTable({
      table: 'recipes',
      nameColumn: 'name',
      queryPrefix: 'indonesian food',
      limit: args.limit,
      delay: args.delay,
      dryRun: args.dryRun,
    });
  }

  if (args.type === 'ingredients' || args.type === 'all') {
    await fillTable({
      table: 'ingredients',
      nameColumn: 'name',
      queryPrefix: 'indonesian spice ingredient',
      limit: args.limit,
      delay: args.delay,
      dryRun: args.dryRun,
    });
  }

  await pool.end();
}

main().catch((err) => {
  console.error('Gagal mengisi gambar:', err);
  process.exit(1);
});
