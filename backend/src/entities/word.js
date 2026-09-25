const { BaseEntity } = require('./baseEntity');
const { isWordType } = require('./wordType');

const WORD_TEXT_PATTERN = /^[A-Za-z]+(?:['-][A-Za-z]+)*$/;

class Word extends BaseEntity {
  static TEXT_MAX_LENGTH = 30;

  constructor(id, text, type) {
    super(id);
    this.text = text;
    this.type = type;
    Object.freeze(this);
  }

  static create(input) {
    if (typeof input !== 'object' || input === null) {
      return { ok: false, errors: ['The word details are missing.'] };
    }

    const errors = [];

    const id = BaseEntity.resolveId(input.id);
    if (id === null) {
      errors.push('The word must have a valid ID.');
    }

    const text = typeof input.text === 'string' ? input.text.trim() : '';
    if (text.length < 1 || text.length > Word.TEXT_MAX_LENGTH) {
      errors.push(`The word must be 1 to ${Word.TEXT_MAX_LENGTH} letters long.`);
    } else if (!WORD_TEXT_PATTERN.test(text)) {
      errors.push('The word can contain only letters, apostrophes or hyphens.');
    }

    if (!isWordType(input.type)) {
      errors.push('Choose a word type from the list.');
    }

    if (errors.length > 0) {
      return { ok: false, errors };
    }

    return { ok: true, value: new Word(id, text, input.type) };
  }
}

module.exports = { Word };
