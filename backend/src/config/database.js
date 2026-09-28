const { readFile } = require('node:fs/promises');
const path = require('node:path');
const msnodesqlv8 = require('msnodesqlv8');
const sql = require('mssql/msnodesqlv8');

const SETUP_SCRIPT_PATH = path.join(__dirname, '..', '..', 'database', 'setup.sql');
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
    `TrustServerCertificate=${process.env.NODE_ENV === 'production' ? 'no' : 'yes'}`
  ].join(';');
}

const pool = new sql.ConnectionPool({
  connectionString: connectionString(process.env.DB_NAME)
});

pool.on('error', (error) => {
  console.error(`Database error: ${error.message}`);
});

async function setUpDatabase() {
  const script = await readFile(SETUP_SCRIPT_PATH, 'utf8');
  const batches = script.split(BATCH_SEPARATOR).map((batch) => batch.trim()).filter(Boolean);
  const connection = await msnodesqlv8.promises.open(connectionString('master'));

  try {
    for (const batch of batches) {
      await connection.promises.query(batch);
    }
  } finally {
    await connection.promises.close();
  }
}

module.exports = { sql, pool, setUpDatabase };
