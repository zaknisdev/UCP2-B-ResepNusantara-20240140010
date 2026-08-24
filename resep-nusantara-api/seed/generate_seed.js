const fs = require('fs');
const path = require('path');

const ingredients = [
  ['Bawang merah', 'gram'], ['Bawang putih', 'gram'], ['Cabai merah keriting', 'gram'],
  ['Cabai rawit', 'gram'], ['Tomat', 'buah'], ['Kemiri', 'butir'], ['Kunyit', 'gram'],
  ['Jahe', 'gram'], ['Lengkuas', 'gram'], ['Serai', 'batang'], ['Daun salam', 'lembar'],
  ['Daun jeruk', 'lembar'], ['Daun kunyit', 'lembar'], ['Santan', 'ml'], ['Gula merah', 'gram'],
  ['Garam', 'gram'], ['Gula pasir', 'gram'], ['Minyak goreng', 'ml'], ['Terasi', 'gram'],
  ['Asam jawa', 'gram'], ['Ketumbar', 'gram'], ['Merica', 'gram'], ['Pala', 'gram'],
  ['Cengkeh', 'gram'], ['Kayu manis', 'batang'], ['Daging sapi', 'gram'], ['Daging ayam', 'gram'],
  ['Ikan kembung', 'ekor'], ['Ikan tongkol', 'ekor'], ['Udang', 'gram'], ['Telur ayam', 'butir'],
  ['Tahu', 'buah'], ['Tempe', 'papan'], ['Kentang', 'buah'], ['Wortel', 'buah'],
  ['Buncis', 'gram'], ['Kacang panjang', 'gram'], ['Terong', 'buah'], ['Labu siam', 'buah'],
  ['Nangka muda', 'gram'], ['Daun singkong', 'ikat'], ['Kelapa parut', 'gram'], ['Beras', 'gram'],
  ['Beras ketan', 'gram'], ['Tepung beras', 'gram'], ['Tepung terigu', 'gram'],
  ['Tepung tapioka', 'gram'], ['Daun pisang', 'lembar'], ['Kecap manis', 'ml'],
  ['Petai', 'papan'], ['Jengkol', 'gram'], ['Kacang tanah', 'gram'], ['Mie kuning', 'gram'],
  ['Bihun', 'gram'], ['Tauge', 'gram'], ['Kol', 'gram'], ['Timun', 'buah'],
  ['Jeruk nipis', 'buah'], ['Daun kemangi', 'ikat'], ['Bawang goreng', 'gram'],
  ['Emping', 'gram'], ['Kerupuk', 'buah'], ['Cuka', 'ml'], ['Air kelapa', 'ml'],
  ['Daun bawang', 'batang'], ['Seledri', 'batang'],
];

const regions = [
  'Aceh', 'Sumatra Utara', 'Sumatra Barat', 'Riau', 'Jambi', 'Sumatra Selatan',
  'Lampung', 'Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Yogyakarta', 'Jawa Timur',
  'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur', 'Kalimantan Barat',
  'Kalimantan Selatan', 'Sulawesi Selatan', 'Sulawesi Utara', 'Maluku', 'Papua',
  'Betawi', 'Madura', 'Minangkabau',
];

const categories = ['Sup', 'Gorengan', 'Sambal', 'Kari', 'Tumisan', 'Panggangan', 'Sate', 'Nasi', 'Mie', 'Kue', 'Lauk', 'Pepes'];
const difficulties = ['mudah', 'sedang', 'sulit'];

const recipeNames = [
  'Rendang Daging', 'Sate Padang', 'Soto Betawi', 'Soto Lamongan', 'Gudeg Yogyakarta',
  'Nasi Goreng Kampung', 'Mie Aceh', 'Pempek Palembang', 'Coto Makassar', 'Rawon Surabaya',
  'Gulai Ayam', 'Gulai Kambing', 'Sayur Asem', 'Sayur Lodeh', 'Opor Ayam', 'Ayam Betutu',
  'Ayam Taliwang', 'Pepes Ikan', 'Pepes Tahu', 'Botok Tempe', 'Balado Terong',
  'Balado Ikan Teri', 'Sambal Matah', 'Sambal Terasi', 'Sambal Bawang', 'Karedok',
  'Gado-Gado', 'Pecel Madiun', 'Lotek', 'Ketoprak', 'Tahu Tek', 'Rujak Cingur',
  'Rujak Buah', 'Tekwan', 'Model Palembang', 'Bakso Sapi', 'Batagor', 'Siomay Bandung',
  'Nasi Liwet', 'Nasi Uduk', 'Nasi Kuning', 'Lontong Sayur', 'Ketupat Sayur',
  'Tumis Kangkung', 'Tumis Buncis', 'Tumis Tauge', 'Cap Cay', 'Sup Buntut',
  'Sup Kimlo', 'Sup Ayam Jamur', 'Kari Ayam', 'Kari Kambing', 'Ikan Bakar Rica',
  'Ikan Woku Belanga', 'Ayam Woku', 'Bebek Betutu', 'Bebek Goreng', 'Empal Gentong',
  'Empal Gepuk', 'Semur Jengkol', 'Semur Daging', 'Perkedel Kentang', 'Perkedel Jagung',
  'Bakwan Sayur', 'Tahu Isi', 'Risoles Sayur', 'Klepon', 'Onde-Onde', 'Kue Lapis',
  'Kue Cucur', 'Serabi Bandung', 'Getuk Lindri', 'Dadar Gulung', 'Kolak Pisang',
  'Es Cendol', 'Wedang Ronde', 'Bubur Manado', 'Bubur Ayam', 'Papeda Ikan Kuah Kuning',
];

function pick(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function pickOne(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function escape(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

const recipes = recipeNames.map((name, idx) => {
  const category = pickOne(categories);
  const region = pickOne(regions);
  const difficulty = pickOne(difficulties);
  const cookTime = [15, 20, 30, 45, 60, 90, 120][Math.floor(Math.random() * 7)];
  const servings = [2, 3, 4, 5, 6][Math.floor(Math.random() * 5)];
  const description = `${name} adalah hidangan khas ${region} dengan cita rasa autentik nusantara, cocok disajikan untuk ${servings} porsi.`;
  return { id: idx + 1, name, category, region, difficulty, cookTime, servings, description };
});

const units = ['gram', 'sdm', 'sdt', 'buah', 'batang', 'lembar', 'butir', 'ml'];
const notesPool = ['iris tipis', 'memarkan', 'cincang halus', 'potong dadu', 'haluskan', null, null, 'sesuai selera'];

const recipeIngredients = [];
recipes.forEach((recipe) => {
  const ingredientCount = 4 + Math.floor(Math.random() * 4); // 4-7 ingredients per recipe
  const chosen = pick(ingredients, ingredientCount);
  chosen.forEach(([ingName, defaultUnit], i) => {
    const ingredientId = ingredients.findIndex((x) => x[0] === ingName) + 1;
    const quantity = (Math.random() * 500 + 1).toFixed(0);
    const unit = Math.random() > 0.7 ? pickOne(units) : defaultUnit;
    const notes = pickOne(notesPool);
    recipeIngredients.push({
      recipeId: recipe.id,
      ingredientId,
      quantity,
      unit,
      notes,
    });
  });
});

let sql = `-- Resep Nusantara API - Seed Data
-- Jalankan schema.sql terlebih dahulu sebelum file ini
-- Generated: ${ingredients.length} ingredients, ${recipes.length} recipes, ${recipeIngredients.length} recipe_ingredients relations

`;

sql += `-- ==================== INGREDIENTS (${ingredients.length}) ====================\n`;
sql += `INSERT INTO ingredients (name, default_unit) VALUES\n`;
sql += ingredients.map(([name, unit]) => `(${escape(name)}, ${escape(unit)})`).join(',\n');
sql += ';\n\n';

sql += `-- ==================== RECIPES (${recipes.length}) ====================\n`;
sql += `INSERT INTO recipes (name, category, region, difficulty, cook_time_minutes, servings, description) VALUES\n`;
sql += recipes
  .map(
    (r) =>
      `(${escape(r.name)}, ${escape(r.category)}, ${escape(r.region)}, ${escape(r.difficulty)}, ${r.cookTime}, ${r.servings}, ${escape(r.description)})`
  )
  .join(',\n');
sql += ';\n\n';

sql += `-- ==================== RECIPE_INGREDIENTS (${recipeIngredients.length}) ====================\n`;
sql += `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit, notes) VALUES\n`;
sql += recipeIngredients
  .map(
    (ri) =>
      `(${ri.recipeId}, ${ri.ingredientId}, ${ri.quantity}, ${escape(ri.unit)}, ${escape(ri.notes)})`
  )
  .join(',\n');
sql += ';\n';

fs.writeFileSync(path.join(__dirname, 'seed.sql'), sql, 'utf-8');
console.log(`seed.sql generated: ${ingredients.length} ingredients, ${recipes.length} recipes, ${recipeIngredients.length} relations`);
