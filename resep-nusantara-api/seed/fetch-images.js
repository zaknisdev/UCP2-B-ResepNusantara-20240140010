// Isi kolom image_url untuk recipes & ingredients dengan hasil pencarian
// foto dari Unsplash API (https://api.unsplash.com/search/photos).
//
// Hanya UNSPLASH_ACCESS_KEY yang dipakai (header "Authorization: Client-ID
// <access_key>"), sesuai skema autentikasi publik Unsplash untuk endpoint
// search. Secret key tidak diperlukan di sini (hanya dipakai untuk alur
// OAuth pihak ketiga).
//
// Resumable: baris yang sudah punya image_url dilewati, jadi script ini
// aman dijalankan berkali-kali / dilanjut kalau sempat berhenti. Untuk
// mengulang baris yang sudah terisi (mis. hasil sebelumnya ternyata tidak
// relevan), kosongkan dulu image_url baris itu (lihat
// seed/reset_flagged_images.js).
//
// Strategi relevansi (v2): setiap query mengambil beberapa kandidat
// (per_page=5), lalu tiap kandidat diberi skor berdasarkan kecocokan kata
// di alt_description/description/tags terhadap nama resep/bahan, dikurangi
// kalau ada kata yang menandakan foto itu BUKAN makanan (potret orang,
// bangunan, pemandangan, hewan hidup, dsb). Kalau tidak ada kandidat yang
// cukup relevan (skor di bawah ambang), baris dibiarkan tanpa gambar
// (frontend otomatis pakai fallback emoji) -- ini sengaja, karena gambar
// yang salah/menyesatkan lebih buruk daripada tidak ada gambar sama sekali.
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

const NEGATIVE_KEYWORDS = [
  'portrait', 'model', 'face', 'fashion', 'man', 'woman', 'men', 'women',
  'people walking', 'street style', 'building', 'architecture', 'landscape',
  'mountain', 'hill', 'sheep', 'goat', 'animal', 'livestock', 'farm animal',
  'wall', 'graffiti', 'wedding', 'protest', 'crowd', 'skyline', 'city street',
];

const POSITIVE_KEYWORDS = [
  'food', 'dish', 'cuisine', 'meal', 'soup', 'curry', 'sauce', 'sate',
  'satay', 'rice', 'noodle', 'chicken', 'beef', 'goat meat', 'fish', 'spicy',
  'indonesian', 'asian food', 'plate of food', 'bowl of', 'meat', 'vegetable',
  'fried', 'grilled', 'sambal', 'spice', 'ingredient', 'cooking', 'recipe',
  'street food', 'traditional food',
];

const ACCEPT_THRESHOLD = 2;

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

function scoreCandidate(photo, nameWords) {
  const text = [
    photo.alt_description || '',
    photo.description || '',
    ...(photo.tags || []).map((t) => t.title || ''),
  ]
    .join(' ')
    .toLowerCase();

  let score = 0;
  for (const word of nameWords) {
    if (word.length > 2 && text.includes(word)) score += 3;
  }
  for (const kw of POSITIVE_KEYWORDS) {
    if (text.includes(kw)) score += 1;
  }
  for (const kw of NEGATIVE_KEYWORDS) {
    if (text.includes(kw)) score -= 5;
  }
  return score;
}

async function searchCandidates(query) {
  const url = new URL('https://api.unsplash.com/search/photos');
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', '5');

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
  return json.results || [];
}

async function findBestImage(name, queries) {
  const nameWords = name.toLowerCase().split(/\s+/);
  let best = null;

  for (const query of queries) {
    const candidates = await searchCandidates(query);
    for (const photo of candidates) {
      const score = scoreCandidate(photo, nameWords);
      if (!best || score > best.score) {
        best = { score, url: photo.urls.small };
      }
    }
    // Kandidat pertama sudah cukup relevan -> tidak perlu buang request lagi
    // ke query fallback berikutnya (hemat kuota Unsplash).
    if (best && best.score >= ACCEPT_THRESHOLD) {
      return best;
    }
  }

  if (best && best.score >= ACCEPT_THRESHOLD) {
    return best;
  }
  return null;
}

async function fillTable({ table, nameColumn, queryPrefix, limit, delay, dryRun }) {
  const { rows } = await pool.query(
    `SELECT id, ${nameColumn} AS name FROM ${table} WHERE image_url IS NULL ORDER BY id ASC`
  );

  const todo = rows.slice(0, Math.min(limit, rows.length));
  console.log(`[${table}] ${rows.length} baris belum punya gambar, memproses ${todo.length}...`);

  let filled = 0;
  let skippedNoMatch = 0;

  for (const row of todo) {
    const queries = [row.name, `${queryPrefix} ${row.name}`];

    let result = null;
    let rateLimited = false;
    try {
      result = await findBestImage(row.name, queries);
    } catch (err) {
      if (err.message === 'RATE_LIMITED') {
        rateLimited = true;
      } else {
        console.error(`[${table}] #${row.id} "${row.name}" gagal: ${err.message}`);
      }
    }

    if (rateLimited) {
      console.warn(`[${table}] Kena rate limit Unsplash, berhenti di #${row.id}. Jalankan lagi nanti untuk lanjut.`);
      break;
    }

    if (result) {
      if (!dryRun) {
        await pool.query(`UPDATE ${table} SET image_url = $1 WHERE id = $2`, [result.url, row.id]);
      }
      filled += 1;
      console.log(`[${table}] #${row.id} "${row.name}" -> (skor ${result.score}) ${result.url}`);
    } else {
      skippedNoMatch += 1;
      console.log(`[${table}] #${row.id} "${row.name}" -> tidak ada kandidat cukup relevan, dilewati (fallback emoji)`);
    }

    await sleep(delay);
  }

  console.log(`[${table}] Selesai. ${filled}/${todo.length} terisi, ${skippedNoMatch} dilewati (tidak relevan/tidak ada hasil).`);
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
      queryPrefix: 'traditional indonesian food',
      limit: args.limit,
      delay: args.delay,
      dryRun: args.dryRun,
    });
  }

  if (args.type === 'ingredients' || args.type === 'all') {
    await fillTable({
      table: 'ingredients',
      nameColumn: 'name',
      queryPrefix: 'indonesian cooking spice ingredient',
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
