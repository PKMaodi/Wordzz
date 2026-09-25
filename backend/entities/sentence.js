const { BaseEntity } = require('./baseEntity');

class Sentence extends BaseEntity {
  static MAX_WORDS = 50;

  constructor(id, wordIds) {
    super(id);
    this.wordIds = Object.freeze([...wordIds]);
    Object.freeze(this);
  }

  static create(input) {
    if (typeof input !== 'object' || input === null) {
      return { ok: false, errors: ['The sentence details are missing.'] };
    }

    const errors = [];

    const id = BaseEntity.resolveId(input.id);
    if (id === null) {
      errors.push(
        'This sentence could not be identified. Reload your saved sentences and try again.'
      );
    }

    const inputWordIds = Array.isArray(input.wordIds) ? input.wordIds : [];
    let wordIds = [];
    if (inputWordIds.length === 0) {
      errors.push('A sentence needs at least one word before it can be saved.');
    } else if (inputWordIds.length > Sentence.MAX_WORDS) {
      errors.push(
        `A sentence can have at most ${Sentence.MAX_WORDS} words. Remove some words and try again.`
      );
    } else {
      wordIds = Array.from(inputWordIds, (wordId) => BaseEntity.parseId(wordId));
      if (wordIds.includes(null)) {
        errors.push(
          'One or more words in this sentence are not valid. Remove them and add them again from the word list.'
        );
      }
    }

    if (errors.length > 0) {
      return { ok: false, errors };
    }

    return { ok: true, value: new Sentence(id, wordIds) };
  }
}

module.exports = { Sentence };
