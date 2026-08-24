require('dotenv').config();
const app = require('../src/app');

module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Resep Nusantara API running on http://localhost:${port}`);
  });
}
