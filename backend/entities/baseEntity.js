const { randomUUID } = require('node:crypto');
const { validate, NIL } = require('uuid');

class BaseEntity {
  static NIL_GUID = NIL;

  static parseId(value) {
    if (!validate(value)) {
      return null;
    }
    const id = value.toLowerCase();
    return id === BaseEntity.NIL_GUID ? null : id;
  }

  static resolveId(value) {
    return value === undefined ? randomUUID() : BaseEntity.parseId(value);
  }

  constructor(id) {
    this.id = id;
  }
}

module.exports = { BaseEntity };
