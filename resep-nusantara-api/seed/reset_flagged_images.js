// Kosongkan image_url untuk baris tertentu (dipakai setelah audit visual
// menemukan gambar yang tidak relevan) supaya baris itu diproses ulang
// oleh seed/fetch-images.js pada run berikutnya.
//
// Usage:
//   node seed/reset_flagged_images.js --type=recipes --ids=10,12,18
//   node seed/reset_flagged_images.js --type=ingredients --ids=3,7

require('dotenv').config();
const pool = require('../src/config/db');

function parseArgs() {
  const args = { type: null, ids: [] };
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--type=')) args.type = arg.split('=')[1];
    else if (arg.startsWith('--ids=')) {
      args.ids = arg
        .split('=')[1]
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n));
    }
  }
  return args;
}

async function main() {
  const { type, ids } = parseArgs();

  if (!['recipes', 'ingredients'].includes(type)) {
    throw new Error('Gunakan --type=recipes atau --type=ingredients');
  }
  if (!ids.length) {
    throw new Error('Gunakan --ids=1,2,3');
  }

  const result = await pool.query(
    `UPDATE ${type} SET image_url = NULL WHERE id = ANY($1::int[]) RETURNING id, name`,
    [ids]
  );

  console.log(`[${type}] Reset image_url untuk ${result.rows.length} baris:`);
  result.rows.forEach((r) => console.log(`  #${r.id} ${r.name}`));

  await pool.end();
}

main().catch((err) => {
  console.error('Gagal reset image_url:', err);
  process.exit(1);
});
