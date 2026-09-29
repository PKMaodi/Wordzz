const { readFile } = require('node:fs/promises');
const path = require('node:path');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const sql = IS_PRODUCTION ? require('mssql') : require('mssql/msnodesqlv8');

const DATABASE_FOLDER = path.join(__dirname, '..', '..', 'database');
const BATCH_SEPARATOR = /^[ \t]*GO[ \t]*\r?$/im;

function connectionStringValue(value) {
  return `{${String(value).replace(/}/g, '}}')}}`;
}

function connectionString(database) {
  return [
    'Driver={ODBC Driver 17 for SQL Server}',
    `Server=${connectionStringValue(`${process.env.DB_HOST},${Number(process.env.DB_PORT || 1433)}`)}`,
    `Database=${connectionStringValue(database)}`,
    'Trusted_Connection=yes',
    'Encrypt=yes',
    'TrustServerCertificate=yes'
  ].join(';');
}

function connectionConfig(database) {
  if (!IS_PRODUCTION) {
    return { connectionString: connectionString(database) };
  }

  return {
    server: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 1433),
    database,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
      encrypt: true,
      trustServerCertificate: false
    }
  };
}

const pool = new sql.ConnectionPool(connectionConfig(process.env.DB_NAME));

pool.on('error', (error) => {
  console.error(`Database error: ${error.message}`);
});

async function runScript(fileName, database) {
  const script = await readFile(path.join(DATABASE_FOLDER, fileName), 'utf8');
  const batches = script.split(BATCH_SEPARATOR).map((batch) => batch.trim()).filter(Boolean);
  const scriptPool = await new sql.ConnectionPool({ ...connectionConfig(database), pool: { max: 1 } }).connect();

  try {
    for (const batch of batches) {
      await scriptPool.request().batch(batch);
    }
  } finally {
    await scriptPool.close();
  }
}

async function setUpDatabase() {
  if (!IS_PRODUCTION) {
    await runScript('create-database.sql', 'master');
  }
  await runScript('setup.sql', process.env.DB_NAME);
}

module.exports = { sql, pool, setUpDatabase };
