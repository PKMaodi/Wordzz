const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { WORD_TYPES, isWordType } = require('../src/entities/wordType');

const setupSql = readFileSync(path.join(__dirname, '..', 'database', 'setup.sql'), 'utf8');
const wordTypes = Object.values(WORD_TYPES).sort();

test('the database CHECK constraint allows exactly the word types in WORD_TYPES', () => {
  const checkList = /CONSTRAINT CK_Words_Type CHECK \(Type IN \(([^)]*)\)\)/.exec(setupSql);

  assert.ok(checkList, 'CK_Words_Type was not found in setup.sql.');
  assert.deepEqual([...checkList[1].matchAll(/N'([^']+)'/g)].map((match) => match[1]).sort(), wordTypes);
});

test('the starter words cover exactly the word types in WORD_TYPES', () => {
  const starterWords = /FROM \(VALUES([\s\S]*?)\) AS StarterWords/.exec(setupSql);

  assert.ok(starterWords, 'The starter word list was not found in setup.sql.');
  assert.deepEqual([...starterWords[1].matchAll(/\(N'([^']+)',/g)].map((match) => match[1]).sort(), wordTypes);
});

test('isWordType accepts only exact word type names', () => {
  assert.equal(isWordType('Noun'), true);
  assert.equal(isWordType('noun'), false);
  assert.equal(isWordType(undefined), false);
});
