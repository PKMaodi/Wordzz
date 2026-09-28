const { sql, pool } = require('../config/database');
const { Word } = require('../entities/word');

const TYPE_MAX_LENGTH = 20;

const WORD_DELETE_RESULTS = Object.freeze({
  Deleted: 'Deleted',
  NotFound: 'NotFound',
  InUse: 'InUse'
});

function toWord(row) {
  return new Word(row.id.toLowerCase(), row.text, row.type);
}

function wordRequest(word) {
  return pool.request()
    .input('id', sql.UniqueIdentifier, word.id)
    .input('text', sql.NVarChar(Word.TEXT_MAX_LENGTH), word.text)
    .input('type', sql.NVarChar(TYPE_MAX_LENGTH), word.type);
}

async function findAll() {
  const result = await pool.request()
    .query('SELECT Id AS id, Text AS text, Type AS type FROM dbo.Words ORDER BY Type, Text;');
  return result.recordset.map(toWord);
}

async function findById(id) {
  const result = await pool.request()
    .input('id', sql.UniqueIdentifier, id)
    .query('SELECT Id AS id, Text AS text, Type AS type FROM dbo.Words WHERE Id = @id;');
  return result.recordset.length > 0 ? toWord(result.recordset[0]) : null;
}

async function create(word) {
  await wordRequest(word).query('INSERT INTO dbo.Words (Id, Text, Type) VALUES (@id, @text, @type);');
  return word;
}

async function update(word) {
  const result = await wordRequest(word).query('UPDATE dbo.Words SET Text = @text, Type = @type WHERE Id = @id;');
  return result.rowsAffected[0] > 0 ? word : null;
}


module.exports = { WORD_DELETE_RESULTS, findAll, findById, create, update};
