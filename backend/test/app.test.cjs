const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const { createApp } = require('../app.cjs');

function createFakePool() {
  const conversations = new Set();
  const messages = [];
  return {
    messages,
    async execute(sql, parameters = []) {
      if (sql.startsWith('SELECT 1')) return [[{ 1: 1 }], []];
      if (sql.startsWith('INSERT INTO conversations')) {
        conversations.add(parameters[0]);
        return [{ affectedRows: 1 }, []];
      }
      if (sql.startsWith('SELECT id FROM conversations')) {
        return [conversations.has(parameters[0]) ? [{ id: parameters[0] }] : [], []];
      }
      if (sql.startsWith('INSERT INTO chat_messages')) {
        messages.push({ conversationId: parameters[0], role: parameters[1], content: parameters[2] });
        return [{ affectedRows: 1 }, []];
      }
      if (sql.startsWith('SELECT role, content')) {
        const history = messages
          .filter((message) => message.conversationId === parameters[0])
          .slice(-12)
          .reverse()
          .map(({ role, content }) => ({ role, content }));
        return [history, []];
      }
      return [{ affectedRows: 1 }, []];
    },
  };
}

let server;
let baseUrl;
const pool = createFakePool();
let ollamaFetch = async () => Response.json({ message: { content: '¡Vamos con una rutina segura!' } });

before(async () => {
  server = createApp({
    pool,
    fetchImpl: (...args) => ollamaFetch(...args),
    config: {
      ollamaBaseUrl: 'http://ollama.test',
      ollamaModel: 'gemma3:latest',
      ollamaTimeoutMs: 1000,
    },
    frontendDirectory: 'C:\\directory-that-does-not-exist',
  }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('health endpoint checks the MySQL pool', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok', mysql: 'connected' });
});

test('chat saves the conversation and sends context to Gemma 3', async () => {
  let ollamaRequest;
  ollamaFetch = async (url, options) => {
    ollamaRequest = { url, body: JSON.parse(options.body) };
    return Response.json({ message: { content: '¡Vamos con una rutina segura!' } });
  };

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: 'Dame una rutina para principiantes.' }),
  });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.reply, '¡Vamos con una rutina segura!');
  assert.match(result.conversationId, /^[0-9a-f-]{36}$/i);
  assert.equal(result.model, 'gemma3:latest');
  assert.equal(ollamaRequest.url, 'http://ollama.test/api/chat');
  assert.equal(ollamaRequest.body.messages.at(-1).content, 'Dame una rutina para principiantes.');
  assert.deepEqual(
    pool.messages.filter((entry) => entry.conversationId === result.conversationId).map((entry) => entry.role),
    ['user', 'assistant'],
  );
});

test('chat validates empty and oversized messages without calling Ollama', async () => {
  ollamaFetch = async () => {
    throw new Error('Ollama must not be called for invalid input.');
  };

  for (const message of ['', 'a'.repeat(2001)]) {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    assert.equal(response.status, 400);
  }
});

test('chat reports Ollama connection failures explicitly', async () => {
  ollamaFetch = async () => {
    throw new TypeError('fetch failed');
  };
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: 'Hola.' }),
  });
  const result = await response.json();

  assert.equal(response.status, 502);
  assert.match(result.error, /conectar con Ollama/);
});
