const { test } = require('node:test');
const assert = require('node:assert/strict');
const sentenceRepository = require('../src/repositories/sentenceRepository');
const { Sentence } = require('../src/entities/sentence');
const {
  getSentences,
  getSentenceById,
  createSentence,
  updateSentence,
  deleteSentence
} = require('../src/controllers/sentenceController');

const SENTENCE_ID = '5d9e2b7c-1a3f-4e6d-8c2b-9f4a1e7d3c05';
const OTHER_ID = '8b6f1d2a-9c4e-4f7a-b1d3-2e5c7a9f0b64';
const WORD_ID = '3f2c8a4e-5b1d-4c7e-9a2f-6d8e1b0c7a53';
const SENTENCE_NOT_FOUND = {
  statusCode: 404,
  message: 'This sentence could not be found. Reload your saved sentences and try again.'
};

function fakeResponse() {
  return {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    }
  };
}

async function call(handler, req) {
  const res = fakeResponse();
  await handler({ params: {}, query: {}, ...req }, res);
  return res;
}

function savedSentence(sentence) {
  return { id: sentence.id, createdAt: new Date(), updatedAt: new Date(), words: [] };
}

test('getSentences answers with the first 20 sentences when no page is given', async (t) => {
  const items = [savedSentence({ id: SENTENCE_ID })];
  const findPage = t.mock.method(sentenceRepository, 'findPage', async () => ({ items, total: 1 }));

  const res = await call(getSentences, {});

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { items, total: 1, page: 1, pageSize: 20 });
  assert.deepEqual(findPage.mock.calls[0].arguments, [{ offset: 0, limit: 20 }]);
});

test('getSentences skips the sentences on earlier pages', async (t) => {
  const findPage = t.mock.method(sentenceRepository, 'findPage', async () => ({ items: [], total: 45 }));

  const res = await call(getSentences, { query: { page: '3', pageSize: '10' } });

  assert.deepEqual(res.body, { items: [], total: 45, page: 3, pageSize: 10 });
  assert.deepEqual(findPage.mock.calls[0].arguments, [{ offset: 20, limit: 10 }]);
});

test('getSentences accepts the largest page and page size', async (t) => {
  const findPage = t.mock.method(sentenceRepository, 'findPage', async () => ({ items: [], total: 0 }));

  const res = await call(getSentences, { query: { page: '100000', pageSize: '100' } });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(findPage.mock.calls[0].arguments, [{ offset: 9999900, limit: 100 }]);
});

test('getSentences answers 400 and loads nothing when the page values are not valid', async (t) => {
  const findPage = t.mock.method(sentenceRepository, 'findPage', async () => ({ items: [], total: 0 }));

  for (const value of ['0', '-1', '1.5', 'abc', '', ' 2', ['1', '2']]) {
    const res = await call(getSentences, { query: { page: value, pageSize: value } });

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
      statusCode: 400,
      message: 'Your saved sentences could not be loaded. Fix the problems listed and try again.',
      errors: ['The page must be a whole number from 1 to 100000.', 'The page size must be a whole number from 1 to 100.']
    });
  }

  for (const query of [{ page: '100001' }, { pageSize: '101' }]) {
    const res = await call(getSentences, { query });

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.errors.length, 1);
  }
  assert.equal(findPage.mock.callCount(), 0);
});

test('getSentenceById answers with the sentence, looked up by its lowercase ID', async (t) => {
  const sentence = savedSentence({ id: SENTENCE_ID });
  const findById = t.mock.method(sentenceRepository, 'findById', async () => sentence);

  const res = await call(getSentenceById, { params: { id: SENTENCE_ID.toUpperCase() } });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body, sentence);
  assert.deepEqual(findById.mock.calls[0].arguments, [SENTENCE_ID]);
});

test('getSentenceById answers 404 for a sentence that does not exist or an ID that is not valid', async (t) => {
  const findById = t.mock.method(sentenceRepository, 'findById', async () => null);

  for (const id of [SENTENCE_ID, 'not-an-id']) {
    const res = await call(getSentenceById, { params: { id } });

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, SENTENCE_NOT_FOUND);
  }
  assert.equal(findById.mock.callCount(), 1);
});

test('createSentence saves a new sentence with a server ID and answers 201', async (t) => {
  const create = t.mock.method(sentenceRepository, 'create', async (sentence) => savedSentence(sentence));

  const res = await call(createSentence, { body: { id: OTHER_ID, wordIds: [WORD_ID.toUpperCase(), WORD_ID] } });

  const saved = create.mock.calls[0].arguments[0];
  assert.equal(res.statusCode, 201);
  assert.notEqual(saved.id, OTHER_ID);
  assert.ok(Sentence.parseId(saved.id));
  assert.deepEqual(saved.wordIds, [WORD_ID, WORD_ID]);
  assert.equal(res.body.id, saved.id);
});

test('createSentence answers 400 with every problem and saves nothing when the words are not valid', async (t) => {
  const create = t.mock.method(sentenceRepository, 'create', async (sentence) => savedSentence(sentence));

  for (const body of [undefined, {}, { wordIds: [] }, { wordIds: ['not-an-id'] }, { wordIds: WORD_ID }]) {
    const res = await call(createSentence, { body });

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'The sentence could not be saved. Fix the problems listed and try again.');
    assert.ok(res.body.errors.length > 0);
  }
  assert.equal(create.mock.callCount(), 0);
});

test('createSentence passes database errors on, so the error handler can answer', async (t) => {
  const missingWord = new Error('Missing word');
  t.mock.method(sentenceRepository, 'create', async () => {
    throw missingWord;
  });

  await assert.rejects(call(createSentence, { body: { wordIds: [WORD_ID] } }), missingWord);
});

test('updateSentence saves the sentence under the ID in the address, not the one in the body', async (t) => {
  const update = t.mock.method(sentenceRepository, 'update', async (sentence) => savedSentence(sentence));

  const res = await call(updateSentence, { params: { id: SENTENCE_ID }, body: { id: OTHER_ID, wordIds: [WORD_ID] } });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.id, SENTENCE_ID);
  assert.deepEqual(update.mock.calls[0].arguments[0].wordIds, [WORD_ID]);
});

test('updateSentence answers 404 when the sentence does not exist or the ID is not valid', async (t) => {
  const update = t.mock.method(sentenceRepository, 'update', async () => null);

  for (const id of [SENTENCE_ID, 'not-an-id']) {
    const res = await call(updateSentence, { params: { id }, body: { wordIds: [WORD_ID] } });

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, SENTENCE_NOT_FOUND);
  }
  assert.equal(update.mock.callCount(), 1);
});

test('updateSentence answers 400 and saves nothing when the words are not valid', async (t) => {
  const update = t.mock.method(sentenceRepository, 'update', async (sentence) => savedSentence(sentence));

  const res = await call(updateSentence, { params: { id: SENTENCE_ID }, body: { wordIds: [] } });

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body.errors, ['A sentence needs at least one word before it can be saved.']);
  assert.equal(update.mock.callCount(), 0);
});

test('deleteSentence answers 204 when the sentence is deleted', async (t) => {
  t.mock.method(sentenceRepository, 'deleteById', async () => true);

  const res = await call(deleteSentence, { params: { id: SENTENCE_ID } });

  assert.equal(res.statusCode, 204);
  assert.equal(res.ended, true);
});

test('deleteSentence answers 404 when the sentence does not exist or the ID is not valid', async (t) => {
  const deleteById = t.mock.method(sentenceRepository, 'deleteById', async () => false);

  for (const id of [SENTENCE_ID, 'not-an-id']) {
    const res = await call(deleteSentence, { params: { id } });

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, SENTENCE_NOT_FOUND);
  }
  assert.equal(deleteById.mock.callCount(), 1);
});
