const test = require('node:test');
const assert = require('node:assert/strict');
const { BaseEntity } = require('../src/entities/baseEntity');
const { Word } = require('../src/entities/word');
const { Sentence } = require('../src/entities/sentence');

const FIRST_WORD_ID = '6f9619ff-8b86-4011-b42d-00c04fc964ff';
const SECOND_WORD_ID = '0f8fad5b-d9cb-469f-a165-70867728950e';

test('parseId returns a valid GUID in lowercase', () => {
  assert.equal(BaseEntity.parseId(FIRST_WORD_ID.toUpperCase()), FIRST_WORD_ID);
});

test('parseId rejects the nil and max GUIDs, malformed text and non-text values', () => {
  for (const value of [BaseEntity.NIL_GUID, BaseEntity.MAX_GUID, 'not-a-guid', 42, null, undefined]) {
    assert.equal(BaseEntity.parseId(value), null);
  }
});

test('resolveId creates a new GUID only when no ID is given', () => {
  assert.notEqual(BaseEntity.parseId(BaseEntity.resolveId(undefined)), null);
  assert.equal(BaseEntity.resolveId(null), null);
});

test('Word.create accepts a valid word and trims its text', () => {
  const result = Word.create({ text: '  Cat ', type: 'Noun' });

  assert.equal(result.ok, true);
  assert.equal(result.value.text, 'Cat');
  assert.equal(result.value.type, 'Noun');
  assert.notEqual(BaseEntity.parseId(result.value.id), null);
  assert.equal(Object.isFrozen(result.value), true);
});

test('Word.create accepts apostrophes and hyphens between letters', () => {
  assert.equal(Word.create({ text: "o'clock", type: 'Noun' }).ok, true);
  assert.equal(Word.create({ text: 'well-known', type: 'Adjective' }).ok, true);
});

test('Word.create reports every problem with invalid details', () => {
  assert.deepEqual(Word.create({ id: 'bad', text: 'café', type: 'noun' }).errors, [
    'The word must have a valid ID.',
    'The word can contain only letters, apostrophes or hyphens.',
    'Choose a word type from the list.'
  ]);
  assert.deepEqual(Word.create({ text: 'a'.repeat(Word.TEXT_MAX_LENGTH + 1), type: 'Noun' }).errors, [
    'The word must be 1 to 30 letters long.'
  ]);
  assert.deepEqual(Word.create({ text: '   ', type: 'Noun' }).errors, ['The word must be 1 to 30 letters long.']);
  assert.deepEqual(Word.create(undefined).errors, ['The word details are missing.']);
});

test('Sentence.create keeps word order, allows repeated words and stores IDs in lowercase', () => {
  const result = Sentence.create({ wordIds: [FIRST_WORD_ID.toUpperCase(), SECOND_WORD_ID, FIRST_WORD_ID] });

  assert.equal(result.ok, true);
  assert.deepEqual(result.value.wordIds, [FIRST_WORD_ID, SECOND_WORD_ID, FIRST_WORD_ID]);
  assert.equal(Object.isFrozen(result.value), true);
  assert.equal(Object.isFrozen(result.value.wordIds), true);
});

test('Sentence.create rejects missing, empty, oversized and invalid word lists', () => {
  assert.deepEqual(Sentence.create(null).errors, ['The sentence details are missing.']);
  assert.deepEqual(Sentence.create({ wordIds: [] }).errors, [
    'A sentence needs at least one word before it can be saved.'
  ]);
  assert.deepEqual(Sentence.create({ wordIds: Array(Sentence.MAX_WORDS + 1).fill(FIRST_WORD_ID) }).errors, [
    'A sentence can have at most 50 words. Remove some words and try again.'
  ]);
  assert.deepEqual(Sentence.create({ wordIds: [FIRST_WORD_ID, 'bad'] }).errors, [
    'One or more words in this sentence are not valid. Remove them and add them again from the word list.'
  ]);
  assert.deepEqual(Sentence.create({ id: 'bad', wordIds: [FIRST_WORD_ID] }).errors, [
    'This sentence could not be identified. Reload your saved sentences and try again.'
  ]);
});
