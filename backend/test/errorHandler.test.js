const test = require('node:test');
const assert = require('node:assert/strict');
const { sql } = require('../src/config/database');
const { notFound, errorHandler } = require('../src/middleware/errorHandler');

function fakeResponse() {
  return {
    headersSent: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

function databaseError(number) {
  const error = new sql.RequestError(`SQL Server error ${number}`, 'EREQUEST');
  error.number = number;
  return error;
}

function handle(error) {
  const res = fakeResponse();
  errorHandler(error, {}, res, () => assert.fail('next should not be called'));
  return res;
}

test('notFound answers with a JSON 404', () => {
  const res = fakeResponse();
  notFound({}, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, {
    statusCode: 404,
    message: 'This address does not exist. Check the URL and try again.'
  });
});

test('duplicate rows become a 409 with a plain message', () => {
  for (const number of [2601, 2627]) {
    const res = handle(databaseError(number));

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.message, 'This already exists. Refresh the page to see the latest list.');
  }
});

test('foreign key conflicts become a 409 with a plain message', () => {
  const res = handle(databaseError(547));

  assert.equal(res.statusCode, 409);
  assert.match(res.body.message, /^This change conflicts with saved data/);
});

test('client errors keep their status and include a list of problems when one is given', () => {
  const error = Object.assign(new Error('Invalid word'), { status: 400, errors: ['Choose a word type from the list.'] });

  assert.deepEqual(handle(error).body, {
    statusCode: 400,
    message: 'The request could not be processed.',
    errors: ['Choose a word type from the list.']
  });
});

test('unexpected errors become a 500 without exposing details', (t) => {
  t.mock.method(console, 'error', () => {});

  for (const error of [databaseError(208), new Error('Something broke')]) {
    const res = handle(error);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { statusCode: 500, message: 'Internal server error' });
  }
});

test('errors after the response has started are passed on to Express', () => {
  const error = new Error('Late failure');
  let forwarded;

  errorHandler(error, {}, { headersSent: true }, (value) => {
    forwarded = value;
  });

  assert.equal(forwarded, error);
});
