require('dotenv').config({ quiet: true });

const REQUIRED_SETTINGS = process.env.NODE_ENV === 'production'
  ? ['CLIENT_ORIGIN', 'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
  : ['CLIENT_ORIGIN', 'DB_HOST', 'DB_NAME'];

const missingSettings = REQUIRED_SETTINGS.filter((name) => !process.env[name]);
if (missingSettings.length > 0) {
  console.error(`Missing settings: ${missingSettings.join(', ')}. Add them to backend/.env on this computer.`);
  process.exit(1);
}

const app = require('./app');
const { pool, setUpDatabase } = require('./config/database');

const HOST = '127.0.0.1';
const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await setUpDatabase();
  } catch (error) {
    console.error(`Unable to set up the database: ${error.message}`);
    process.exit(1);
  }

  console.log('Database setup applied.');

  try {
    await pool.connect();
  } catch (error) {
    console.error(`Unable to connect to the database: ${error.message}`);
    process.exit(1);
  }

  console.log('Database connection established successfully.');

  const server = app.listen(PORT, HOST, (error) => {
    if (error) {
      console.error(`Unable to start the server: ${error.message}`);
      process.exit(1);
    }

    console.log(`Server is running on http://localhost:${PORT}`);
  });

  const shutDown = () => {
    console.log('Shutting down the server.');
    server.close(() => {
      pool.close().finally(() => process.exit(0));
    });
  };

  process.once('SIGINT', shutDown);
  process.once('SIGTERM', shutDown);
}

start();
