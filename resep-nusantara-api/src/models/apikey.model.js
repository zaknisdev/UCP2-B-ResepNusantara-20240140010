const pool = require('../config/db');

async function create({ userId, keyValue, name }) {
  const result = await pool.query(
    `INSERT INTO api_keys (user_id, key_value, name)
     VALUES ($1, $2, $3)
     RETURNING id, name, key_value, is_active, last_used_at, created_at`,
    [userId, keyValue, name]
  );
  return result.rows[0];
}

async function listByUser(userId) {
  const result = await pool.query(
    `SELECT id, name, key_value, is_active, last_used_at, created_at
     FROM api_keys
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

async function findActiveByKeyValue(keyValue) {
  const result = await pool.query(
    `SELECT * FROM api_keys WHERE key_value = $1 AND is_active = true`,
    [keyValue]
  );
  return result.rows[0];
}

async function findByIdAndUser(id, userId) {
  const result = await pool.query(
    `SELECT * FROM api_keys WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return result.rows[0];
}

async function revoke(id, userId) {
  const result = await pool.query(
    `UPDATE api_keys SET is_active = false
     WHERE id = $1 AND user_id = $2
     RETURNING id, name, is_active`,
    [id, userId]
  );
  return result.rows[0];
}

async function touchLastUsed(id) {
  await pool.query('UPDATE api_keys SET last_used_at = NOW() WHERE id = $1', [id]);
}

module.exports = {
  create,
  listByUser,
  findActiveByKeyValue,
  findByIdAndUser,
  revoke,
  touchLastUsed,
};
