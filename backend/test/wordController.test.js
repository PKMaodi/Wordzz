const { test } = require('node:test');
const assert = require('node:assert/strict');
const wordRepository = require('../src/repositories/wordRepository');
const { Word } = require('../src/entities/word');
const { getWords, getWordById, createWord, updateWord, deleteWord } = require('../src/controllers/wordController');

const WORD_ID = '3f2c8a4e-5b1d-4c7e-9a2f-6d8e1b0c7a53';
const OTHER_ID = '8b6f1d2a-9c4e-4f7a-b1d3-2e5c7a9f0b64';
const WORD_NOT_FOUND = { statusCode: 404, message: 'This word could not be found. Refresh the word list and try again.' };

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

test('getWords answers with every saved word', async (t) => {
  const words = [new Word(WORD_ID, 'cat', 'Noun')];
  t.mock.method(wordRepository, 'findAll', async () => words);

  const res = await call(getWords, {});

  assert.equal(res.statusCode, 200);
  assert.equal(res.body, words);
});

test('getWordById answers with the word, looked up by its lowercase ID', async (t) => {
  const word = new Word(WORD_ID, 'cat', 'Noun');
  const findById = t.mock.method(wordRepository, 'findById', async () => word);

  const res = await call(getWordById, { params: { id: WORD_ID.toUpperCase() } });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body, word);
  assert.deepEqual(findById.mock.calls[0].arguments, [WORD_ID]);
});

test('getWordById answers 404 for a word that does not exist or an ID that is not valid', async (t) => {
  const findById = t.mock.method(wordRepository, 'findById', async () => null);

  for (const id of [WORD_ID, 'not-an-id', '00000000-0000-0000-0000-000000000000']) {
    const res = await call(getWordById, { params: { id } });

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, WORD_NOT_FOUND);
  }
  assert.equal(findById.mock.callCount(), 1);
});

test('createWord saves a new word with a server ID and answers 201', async (t) => {
  const create = t.mock.method(wordRepository, 'create', async (word) => word);

  const res = await call(createWord, { body: { id: OTHER_ID, text: '  Cat ', type: 'Noun' } });

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.text, 'Cat');
  assert.equal(res.body.type, 'Noun');
  assert.notEqual(res.body.id, OTHER_ID);
  assert.ok(Word.parseId(res.body.id));
  assert.equal(create.mock.calls[0].arguments[0], res.body);
});

test('createWord answers 400 with every problem and saves nothing when the details are not valid', async (t) => {
  const create = t.mock.method(wordRepository, 'create', async (word) => word);

  for (const body of [undefined, [], { text: 'c4t', type: 'Noun' }, { text: 'cat', type: 'Animal' }]) {
    const res = await call(createWord, { body });

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'The word could not be saved. Fix the problems listed and try again.');
    assert.ok(res.body.errors.length > 0);
  }
  assert.equal(create.mock.callCount(), 0);
});

test('createWord passes database errors on, so the error handler can answer', async (t) => {
  const duplicate = new Error('Duplicate word');
  t.mock.method(wordRepository, 'create', async () => {
    throw duplicate;
  });

  await assert.rejects(call(createWord, { body: { text: 'cat', type: 'Noun' } }), duplicate);
});

test('updateWord saves the word under the ID in the address, not the one in the body', async (t) => {
  const update = t.mock.method(wordRepository, 'update', async (word) => word);

  const res = await call(updateWord, { params: { id: WORD_ID }, body: { id: OTHER_ID, text: 'dog', type: 'Noun' } });

  assert.equal(res.statusCode, 200);
  assert.deepEqual({ ...res.body }, { id: WORD_ID, text: 'dog', type: 'Noun' });
  assert.equal(update.mock.calls[0].arguments[0], res.body);
});

test('updateWord answers 404 when the word does not exist or the ID is not valid', async (t) => {
  const update = t.mock.method(wordRepository, 'update', async () => null);

  for (const id of [WORD_ID, 'not-an-id']) {
    const res = await call(updateWord, { params: { id }, body: { text: 'dog', type: 'Noun' } });

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, WORD_NOT_FOUND);
  }
  assert.equal(update.mock.callCount(), 1);
});

test('updateWord answers 400 and saves nothing when the details are not valid', async (t) => {
  const update = t.mock.method(wordRepository, 'update', async (word) => word);

  const res = await call(updateWord, { params: { id: WORD_ID }, body: { text: '', type: 'Noun' } });

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body.errors, ['The word must be 1 to 30 letters long.']);
  assert.equal(update.mock.callCount(), 0);
});

test('deleteWord answers 204 when the word is deleted', async (t) => {
  t.mock.method(wordRepository, 'deleteById', async () => wordRepository.WORD_DELETE_RESULTS.Deleted);

  const res = await call(deleteWord, { params: { id: WORD_ID } });

  assert.equal(res.statusCode, 204);
  assert.equal(res.ended, true);
});

test('deleteWord answers 409 with a plain message when a saved sentence uses the word', async (t) => {
  t.mock.method(wordRepository, 'deleteById', async () => wordRepository.WORD_DELETE_RESULTS.InUse);

  const res = await call(deleteWord, { params: { id: WORD_ID } });

  assert.equal(res.statusCode, 409);
  assert.match(res.body.message, /^This word is used in at least one saved sentence/);
});

test('deleteWord answers 404 when the word does not exist or the ID is not valid', async (t) => {
  const deleteById = t.mock.method(wordRepository, 'deleteById', async () => wordRepository.WORD_DELETE_RESULTS.NotFound);

  for (const id of [WORD_ID, 'not-an-id']) {
    const res = await call(deleteWord, { params: { id } });

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, WORD_NOT_FOUND);
  }
  assert.equal(deleteById.mock.callCount(), 1);
});
