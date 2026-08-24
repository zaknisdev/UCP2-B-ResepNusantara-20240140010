const express = require('express');
const authRoutes = require('./routes/auth.routes');
const apiKeyRoutes = require('./routes/apikey.routes');
const recipeRoutes = require('./routes/recipe.routes');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ success: true, data: { name: 'Resep Nusantara API', status: 'ok' } });
});

app.use('/auth', authRoutes);
app.use('/dashboard/api-keys', apiKeyRoutes);
app.use('/api/v1', recipeRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
});

module.exports = app;
