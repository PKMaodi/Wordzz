process.env.CLIENT_ORIGIN = 'http://localhost:4200';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

let server;
let baseUrl;

before(() => new Promise((resolve) => {
  server = app.listen(0, '127.0.0.1', () => {
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    resolve();
  });
}));

after(() => new Promise((resolve) => {
  server.close(resolve);
}));

function postJson(path, body) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  });
}

test('unknown addresses answer with JSON instead of an HTML page', async () => {
  const res = await fetch(`${baseUrl}/api/unknown`);

  assert.equal(res.status, 404);
  assert.match(res.headers.get('content-type'), /application\/json/);
  assert.equal((await res.json()).statusCode, 404);
});

test('a request body that is not valid JSON gets a 400 with a plain message', async () => {
  const res = await postJson('/api/unknown', '{not json');

  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { statusCode: 400, message: 'The request body is not valid JSON.' });
});

test('a request body over the size limit gets a 413 with a plain message', async () => {
  const res = await postJson('/api/unknown', JSON.stringify({ text: 'a'.repeat(200000) }));

  assert.equal(res.status, 413);
  assert.deepEqual(await res.json(), { statusCode: 413, message: 'The request is too large.' });
});

test('CORS only ever names the configured client origin, so browsers block other sites', async () => {
  for (const origin of ['http://localhost:4200', 'http://example.com']) {
    const res = await fetch(`${baseUrl}/api/unknown`, {
      method: 'OPTIONS',
      headers: { Origin: origin, 'Access-Control-Request-Method': 'DELETE' }
    });

    assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:4200');
  }
});

test('the health check reports a 503 when the database is not connected', async (t) => {
  t.mock.method(console, 'error', () => {});
  const res = await fetch(`${baseUrl}/api/health`);

  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), {
    statusCode: 503,
    message: 'The database is not reachable. Check that SQL Server is running, then try again.'
  });
});
