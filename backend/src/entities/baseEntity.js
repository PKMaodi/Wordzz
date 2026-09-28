const { randomUUID } = require('node:crypto');
const { validate, NIL, MAX } = require('uuid');

class BaseEntity {
  static NIL_GUID = NIL;
  static MAX_GUID = MAX;

  static parseId(value) {
    if (!validate(value)) {
      return null;
    }
    const id = value.toLowerCase();
    return id === BaseEntity.NIL_GUID || id === BaseEntity.MAX_GUID ? null : id;
  }

  static resolveId(value) {
    return value === undefined ? randomUUID() : BaseEntity.parseId(value);
  }

  constructor(id) {
    this.id = id;
  }
}

module.exports = { BaseEntity };
