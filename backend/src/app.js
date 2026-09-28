const express = require('express');
const cors = require('cors');
const { pool } = require('./config/database');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const wordRoutes = require('./routes/wordRoutes');
const sentenceRoutes = require('./routes/sentenceRoutes');

const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await pool.request().query('SELECT 1;');
    res.json({ status: 'ok' });
  } catch (error) {
    console.error(`Health check failed: ${error.message}`);
    res.status(503).json({
      statusCode: 503,
      message: 'The database is not reachable. Check that SQL Server is running, then try again.'
    });
  }
});

app.use('/api/words', wordRoutes);
app.use('/api/sentences', sentenceRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
