const apiKeyModel = require('../models/apikey.model');

async function authApiKey(req, res, next) {
  const keyValue = req.headers['x-api-key'];

  if (!keyValue) {
    return res.status(401).json({ success: false, message: 'Header x-api-key wajib diisi' });
  }

  try {
    const apiKey = await apiKeyModel.findActiveByKeyValue(keyValue);

    if (!apiKey) {
      return res.status(401).json({ success: false, message: 'API key tidak valid atau tidak aktif' });
    }

    apiKeyModel.touchLastUsed(apiKey.id).catch(() => {});

    req.apiKey = apiKey;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memverifikasi API key' });
  }
}

module.exports = authApiKey;
