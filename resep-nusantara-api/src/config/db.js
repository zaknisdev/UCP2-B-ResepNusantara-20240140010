const { Pool } = require('pg');

// sslmode di query string connection URL akan menimpa opsi `ssl` di bawah
// (pg menggabungkan config dengan hasil parse URL, URL yang menang), jadi
// parameter ssl-related dibuang dari URL agar opsi `ssl` di sini yang dipakai.
function stripSslParams(connectionString) {
  if (!connectionString) return connectionString;
  const url = new URL(connectionString);
  url.searchParams.delete('sslmode');
  url.searchParams.delete('supa');
  return url.toString();
}

const pool = new Pool({
  connectionString: stripSslParams(process.env.DATABASE_URL),
  ssl: { rejectUnauthorized: false },
});

module.exports = pool;
