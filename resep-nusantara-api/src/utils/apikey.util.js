const crypto = require('crypto');

function generateApiKey() {
  const randomPart = crypto.randomBytes(24).toString('hex');
  return `rn_live_${randomPart}`;
}

module.exports = { generateApiKey };
