const express = require('express');
const { randomUUID } = require('node:crypto');
const { existsSync } = require('node:fs');
const path = require('node:path');

const SYSTEM_PROMPT = [
  'Eres FranzFit, un entrenador virtual amable que responde en español.',
  'Ayuda con rutinas generales de gimnasio y calistenia, técnica y hábitos saludables.',
  'Da recomendaciones prudentes, breves y adaptadas al contexto de la conversación.',
  'No diagnostiques lesiones ni sustituyas a profesionales médicos; recomienda detenerse y consultar a un profesional si hay dolor o síntomas.',
].join(' ');

const conversationIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createApp({
  pool,
  fetchImpl = globalThis.fetch,
  config = {
    ollamaBaseUrl: 'http://127.0.0.1:11434',
    ollamaModel: 'gemma3:latest',
    ollamaTimeoutMs: 90000,
  },
  frontendDirectory = path.resolve(__dirname, '..', 'dist', 'ProyedctoPrograMultiMedia', 'browser'),
} = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));

  app.get('/api/health', async (_request, response) => {
    if (!pool) {
      response.status(503).json({ status: 'unavailable', mysql: 'not_configured' });
      return;
    }
    try {
      await pool.execute('SELECT 1');
      response.json({ status: 'ok', mysql: 'connected' });
    } catch (error) {
      console.error('Falló la comprobación de conexión MySQL.', error);
      response.status(503).json({ status: 'unavailable', mysql: 'disconnected' });
    }
  });

  app.post('/api/chat', async (request, response) => {
    const message = typeof request.body?.message === 'string' ? request.body.message.trim() : '';
    const requestedConversationId = request.body?.conversationId;
    if (!message || message.length > 2000) {
      response.status(400).json({ error: 'Escribe un mensaje de hasta 2000 caracteres.' });
      return;
    }
    if (requestedConversationId !== undefined &&
        (typeof requestedConversationId !== 'string' || !conversationIdPattern.test(requestedConversationId))) {
      response.status(400).json({ error: 'El identificador de conversación no es válido.' });
      return;
    }
    if (!pool) {
      response.status(503).json({ error: 'MySQL no está configurado. Revisa la conexión con XAMPP.' });
      return;
    }
    if (typeof fetchImpl !== 'function') {
      response.status(503).json({ error: 'El backend requiere Node.js con soporte para fetch.' });
      return;
    }

    const conversationId = requestedConversationId || randomUUID();
    try {
      if (requestedConversationId) {
        const [conversations] = await pool.execute(
          'SELECT id FROM conversations WHERE id = ? LIMIT 1',
          [conversationId],
        );
        if (!conversations.length) {
          response.status(404).json({ error: 'No se encontró esa conversación.' });
          return;
        }
      } else {
        await pool.execute(
          'INSERT INTO conversations (id) VALUES (?)',
          [conversationId],
        );
      }

      await pool.execute(
        'INSERT INTO chat_messages (conversation_id, role, content) VALUES (?, ?, ?)',
        [conversationId, 'user', message],
      );
      const [history] = await pool.execute(
        'SELECT role, content FROM chat_messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 12',
        [conversationId],
      );
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.reverse().map((entry) => ({ role: entry.role, content: entry.content })),
      ];

      let ollamaResponse;
      try {
        ollamaResponse = await fetchImpl(`${config.ollamaBaseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            model: config.ollamaModel,
            messages,
            stream: false,
          }),
          signal: AbortSignal.timeout(config.ollamaTimeoutMs),
        });
      } catch (error) {
        console.error('No se pudo conectar con Ollama.', error);
        response.status(error?.name === 'TimeoutError' ? 504 : 502).json({
          error: error?.name === 'TimeoutError'
            ? 'Ollama tardó demasiado. Inténtalo otra vez.'
            : 'No se pudo conectar con Ollama. Comprueba que esté iniciado y que Gemma 3 esté instalado.',
        });
        return;
      }

      if (!ollamaResponse.ok) {
        const details = await ollamaResponse.text().catch(() => '');
        console.error(`Ollama respondió ${ollamaResponse.status}.`, details);
        response.status(502).json({
          error: ollamaResponse.status === 404
            ? `No se encontró el modelo "${config.ollamaModel}". Instálalo con ollama pull ${config.ollamaModel}.`
            : 'Ollama rechazó la solicitud. Verifica el modelo y vuelve a intentarlo.',
        });
        return;
      }

      const result = await ollamaResponse.json();
      const reply = typeof result?.message?.content === 'string' ? result.message.content.trim() : '';
      if (!reply) {
        console.error('Ollama devolvió una respuesta vacía o con formato inesperado.');
        response.status(502).json({ error: 'Ollama devolvió una respuesta vacía. Inténtalo otra vez.' });
        return;
      }

      await pool.execute(
        'INSERT INTO chat_messages (conversation_id, role, content) VALUES (?, ?, ?)',
        [conversationId, 'assistant', reply],
      );
      await pool.execute(
        'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [conversationId],
      );

      response.json({ conversationId, reply, model: config.ollamaModel });
    } catch (error) {
      console.error('Falló la solicitud del chatbot o su persistencia en MySQL.', error);
      response.status(503).json({
        error: 'No se pudo guardar la conversación en MySQL. Verifica que XAMPP esté iniciado y que hayas importado database/schema.sql.',
      });
    }
  });

  if (existsSync(path.join(frontendDirectory, 'index.html'))) {
    app.use(express.static(frontendDirectory));
    app.get(/^\/(?!api\/).*/, (_request, response) => {
      response.sendFile(path.join(frontendDirectory, 'index.html'));
    });
  }

  app.use((error, _request, response, _next) => {
    console.error('Error no controlado en el backend.', error);
    response.status(500).json({ error: 'Ocurrió un error inesperado en el servidor.' });
  });

  return app;
}

module.exports = { createApp };
