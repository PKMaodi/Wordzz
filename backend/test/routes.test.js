process.env.CLIENT_ORIGIN = 'http://localhost:4200';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { sql } = require('../src/config/database');
const wordRepository = require('../src/repositories/wordRepository');
const sentenceRepository = require('../src/repositories/sentenceRepository');
const { Word } = require('../src/entities/word');
const app = require('../src/app');

const WORD_ID = '3f2c8a4e-5b1d-4c7e-9a2f-6d8e1b0c7a53';
const SENTENCE_ID = '5d9e2b7c-1a3f-4e6d-8c2b-9f4a1e7d3c05';
const CAT = new Word(WORD_ID, 'cat', 'Noun');

let server;
let baseUrl;

before(() => new Promise((resolve) => {
  server = app.listen(0, '127.0.0.1', () => {
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    resolve();
  });
}));

after(() => new Promise((resolve) => {
  server.close(resolve);
}));

async function send(method, path, body) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

function savedSentence(id, wordIds) {
  return { id, createdAt: new Date('2026-09-28T10:00:00Z'), updatedAt: new Date('2026-09-28T10:00:00Z'), words: wordIds.map(() => CAT) };
}

test('GET /api/words lists the words', async (t) => {
  t.mock.method(wordRepository, 'findAll', async () => [CAT]);

  const res = await send('GET', '/api/words');

  assert.equal(res.status, 200);
  assert.deepEqual(res.body, [{ id: WORD_ID, text: 'cat', type: 'Noun' }]);
});

test('GET /api/words/:id reads one word', async (t) => {
  const findById = t.mock.method(wordRepository, 'findById', async () => CAT);

  const res = await send('GET', `/api/words/${WORD_ID}`);

  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { id: WORD_ID, text: 'cat', type: 'Noun' });
  assert.deepEqual(findById.mock.calls[0].arguments, [WORD_ID]);
});

test('POST /api/words creates a word from the JSON body', async (t) => {
  t.mock.method(wordRepository, 'create', async (word) => word);

  const res = await send('POST', '/api/words', { text: 'dog', type: 'Noun' });

  assert.equal(res.status, 201);
  assert.equal(res.body.text, 'dog');
});

test('PUT /api/words/:id updates the word named in the address', async (t) => {
  const update = t.mock.method(wordRepository, 'update', async (word) => word);

  const res = await send('PUT', `/api/words/${WORD_ID}`, { text: 'dog', type: 'Noun' });

  assert.equal(res.status, 200);
  assert.equal(update.mock.calls[0].arguments[0].id, WORD_ID);
});

test('DELETE /api/words/:id deletes the word', async (t) => {
  const deleteById = t.mock.method(wordRepository, 'deleteById', async () => wordRepository.WORD_DELETE_RESULTS.Deleted);

  const res = await send('DELETE', `/api/words/${WORD_ID}`);

  assert.equal(res.status, 204);
  assert.equal(res.body, null);
  assert.deepEqual(deleteById.mock.calls[0].arguments, [WORD_ID]);
});

test('GET /api/sentences passes the page and page size from the address', async (t) => {
  const findPage = t.mock.method(sentenceRepository, 'findPage', async () => ({ items: [], total: 45 }));

  const res = await send('GET', '/api/sentences?page=3&pageSize=10');

  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { items: [], total: 45, page: 3, pageSize: 10 });
  assert.deepEqual(findPage.mock.calls[0].arguments, [{ offset: 20, limit: 10 }]);
});

test('GET /api/sentences answers 400 when a page value is repeated', async (t) => {
  const findPage = t.mock.method(sentenceRepository, 'findPage', async () => ({ items: [], total: 0 }));

  const res = await send('GET', '/api/sentences?page=1&page=2');

  assert.equal(res.status, 400);
  assert.deepEqual(res.body.errors, ['The page must be a whole number from 1 to 100000.']);
  assert.equal(findPage.mock.callCount(), 0);
});

test('GET /api/sentences/:id reads one sentence with its words', async (t) => {
  t.mock.method(sentenceRepository, 'findById', async (id) => savedSentence(id, [WORD_ID]));

  const res = await send('GET', `/api/sentences/${SENTENCE_ID}`);

  assert.equal(res.status, 200);
  assert.deepEqual(res.body, {
    id: SENTENCE_ID,
    createdAt: '2026-09-28T10:00:00.000Z',
    updatedAt: '2026-09-28T10:00:00.000Z',
    words: [{ id: WORD_ID, text: 'cat', type: 'Noun' }]
  });
});

test('POST /api/sentences creates a sentence from the JSON body', async (t) => {
  const create = t.mock.method(sentenceRepository, 'create', async (sentence) => savedSentence(sentence.id, sentence.wordIds));

  const res = await send('POST', '/api/sentences', { wordIds: [WORD_ID] });

  assert.equal(res.status, 201);
  assert.deepEqual(create.mock.calls[0].arguments[0].wordIds, [WORD_ID]);
});

test('PUT /api/sentences/:id updates the sentence named in the address', async (t) => {
  const update = t.mock.method(sentenceRepository, 'update', async (sentence) => savedSentence(sentence.id, sentence.wordIds));

  const res = await send('PUT', `/api/sentences/${SENTENCE_ID}`, { wordIds: [WORD_ID, WORD_ID] });

  assert.equal(res.status, 200);
  assert.equal(res.body.id, SENTENCE_ID);
  assert.equal(update.mock.calls[0].arguments[0].id, SENTENCE_ID);
});

test('DELETE /api/sentences/:id deletes the sentence', async (t) => {
  t.mock.method(sentenceRepository, 'deleteById', async () => true);

  const res = await send('DELETE', `/api/sentences/${SENTENCE_ID}`);

  assert.equal(res.status, 204);
  assert.equal(res.body, null);
});

test('a duplicate word reported by the database reaches the error handler as a 409', async (t) => {
  t.mock.method(wordRepository, 'create', async () => {
    const error = new sql.RequestError('Violation of UNIQUE KEY constraint', 'EREQUEST');
    error.number = 2627;
    throw error;
  });

  const res = await send('POST', '/api/words', { text: 'cat', type: 'Noun' });

  assert.equal(res.status, 409);
  assert.deepEqual(res.body, { statusCode: 409, message: 'This already exists. Refresh the page to see the latest list.' });
});

test('an unexpected failure answers 500 without exposing details', async (t) => {
  t.mock.method(console, 'error', () => {});
  t.mock.method(sentenceRepository, 'findPage', async () => {
    throw new Error('Connection lost');
  });

  const res = await send('GET', '/api/sentences');

  assert.equal(res.status, 500);
  assert.deepEqual(res.body, { statusCode: 500, message: 'Internal server error' });
});

test('addresses and methods that are not listed answer with the JSON 404', async () => {
  for (const [method, path] of [['PATCH', `/api/words/${WORD_ID}`], ['GET', `/api/words/${WORD_ID}/sentences`], ['DELETE', '/api/sentences']]) {
    const res = await send(method, path);

    assert.equal(res.status, 404);
    assert.equal(res.body.message, 'This address does not exist. Check the URL and try again.');
  }
});
