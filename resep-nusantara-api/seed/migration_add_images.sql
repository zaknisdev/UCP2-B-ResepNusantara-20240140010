-- Migrasi: tambah kolom image_url untuk recipes & ingredients.
-- Dipakai untuk menyimpan URL gambar hasil pencarian Unsplash (lihat
-- seed/fetch-images.js). Aman dijalankan berulang (IF NOT EXISTS).

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS image_url TEXT;
