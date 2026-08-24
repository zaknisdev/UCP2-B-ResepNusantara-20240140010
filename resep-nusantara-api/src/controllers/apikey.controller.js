const apiKeyModel = require('../models/apikey.model');
const { generateApiKey } = require('../utils/apikey.util');

async function generate(req, res) {
  try {
    const { name } = req.body;
    const keyValue = generateApiKey();

    const apiKey = await apiKeyModel.create({
      userId: req.user.id,
      keyValue,
      name: name || null,
    });

    return res.status(201).json({ success: true, data: apiKey });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal membuat API key' });
  }
}

async function list(req, res) {
  try {
    const apiKeys = await apiKeyModel.listByUser(req.user.id);
    return res.json({ success: true, data: apiKeys });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal mengambil daftar API key' });
  }
}

async function revoke(req, res) {
  try {
    const { id } = req.params;

    const existing = await apiKeyModel.findByIdAndUser(id, req.user.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'API key tidak ditemukan' });
    }

    const revoked = await apiKeyModel.revoke(id, req.user.id);
    return res.json({ success: true, data: revoked });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal revoke API key' });
  }
}

module.exports = { generate, list, revoke };
