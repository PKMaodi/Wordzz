const WORD_TYPES = Object.freeze({
  Noun: 'Noun',
  Verb: 'Verb',
  Adjective: 'Adjective',
  Adverb: 'Adverb',
  Pronoun: 'Pronoun',
  Preposition: 'Preposition',
  Conjunction: 'Conjunction',
  Determiner: 'Determiner',
  Exclamation: 'Exclamation'
});

function isWordType(value) {
  return Object.values(WORD_TYPES).includes(value);
}

module.exports = { WORD_TYPES, isWordType };
