const mongoose = require('mongoose');
const app = require('./app');
const { port, mongoUri } = require('./config');

async function start() {
  await mongoose.connect(mongoUri);
  return app.listen(port, () => console.log(`Inventory API listening on port ${port}`));
}

if (require.main === module) {
  start().catch((error) => { console.error(error); process.exit(1); });
}

module.exports = { start };
