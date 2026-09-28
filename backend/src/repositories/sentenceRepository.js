const { sql, pool } = require('../config/database');
const { Word } = require('../entities/word');

const SENTENCE_COLUMNS = `
  s.Id AS sentenceId,
  s.CreatedAt AS createdAt,
  s.UpdatedAt AS updatedAt,
  w.Id AS wordId,
  w.Text AS text,
  w.Type AS type`;

const WORD_JOINS = `
  LEFT JOIN dbo.SentenceWords AS sw ON sw.SentenceId = s.Id
  LEFT JOIN dbo.Words AS w ON w.Id = sw.WordId`;

function toSentences(rows) {
  const sentences = new Map();

  for (const row of rows) {
    const id = row.sentenceId.toLowerCase();
    if (!sentences.has(id)) {
      sentences.set(id, { id, createdAt: row.createdAt, updatedAt: row.updatedAt, words: [] });
    }
    if (row.wordId) {
      sentences.get(id).words.push(new Word(row.wordId.toLowerCase(), row.text, row.type));
    }
  }

  return [...sentences.values()];
}

function insertWordsStatement(request, wordIds) {
  const rows = wordIds.map((wordId, position) => {
    request.input(`wordId${position}`, sql.UniqueIdentifier, wordId);
    return `(@id, ${position}, @wordId${position})`;
  });
  return `INSERT INTO dbo.SentenceWords (SentenceId, Position, WordId) VALUES ${rows.join(', ')};`;
}

async function inTransaction(work) {
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const result = await work(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function readSentence(request, id) {
  const result = await request
    .input('id', sql.UniqueIdentifier, id)
    .query(`
      SELECT ${SENTENCE_COLUMNS}
      FROM dbo.Sentences AS s
      ${WORD_JOINS}
      WHERE s.Id = @id
      ORDER BY sw.Position;
    `);
  return toSentences(result.recordset)[0] ?? null;
}

async function findPage({ offset, limit }) {
  const result = await pool.request()
    .input('offset', sql.Int, offset)
    .input('limit', sql.Int, limit)
    .query(`
      SELECT COUNT(*) AS total FROM dbo.Sentences;

      WITH PageSentences AS (
        SELECT Id, CreatedAt, UpdatedAt
        FROM dbo.Sentences
        ORDER BY CreatedAt DESC, Id DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      )
      SELECT ${SENTENCE_COLUMNS}
      FROM PageSentences AS s
      ${WORD_JOINS}
      ORDER BY s.CreatedAt DESC, s.Id DESC, sw.Position;
    `);
  return { items: toSentences(result.recordsets[1]), total: result.recordsets[0][0].total };
}

async function findById(id) {
  return readSentence(pool.request(), id);
}

async function create(sentence) {
  return inTransaction(async (transaction) => {
    const request = new sql.Request(transaction).input('id', sql.UniqueIdentifier, sentence.id);
    const insertWords = insertWordsStatement(request, sentence.wordIds);
    await request.query(`INSERT INTO dbo.Sentences (Id) VALUES (@id); ${insertWords}`);
    return readSentence(new sql.Request(transaction), sentence.id);
  });
}

async function update(sentence) {
  return inTransaction(async (transaction) => {
    const touched = await new sql.Request(transaction)
      .input('id', sql.UniqueIdentifier, sentence.id)
      .query('UPDATE dbo.Sentences SET UpdatedAt = SYSUTCDATETIME() WHERE Id = @id;');
    if (touched.rowsAffected[0] === 0) {
      return null;
    }

    const request = new sql.Request(transaction).input('id', sql.UniqueIdentifier, sentence.id);
    const insertWords = insertWordsStatement(request, sentence.wordIds);
    await request.query(`DELETE FROM dbo.SentenceWords WHERE SentenceId = @id; ${insertWords}`);
    return readSentence(new sql.Request(transaction), sentence.id);
  });
}

async function deleteById(id) {
  return inTransaction(async (transaction) => {
    const result = await new sql.Request(transaction)
      .input('id', sql.UniqueIdentifier, id)
      .query('DELETE FROM dbo.SentenceWords WHERE SentenceId = @id; DELETE FROM dbo.Sentences WHERE Id = @id;');
    return result.rowsAffected[1] > 0;
  });
}

module.exports = { findPage, findById, create, update, deleteById };
