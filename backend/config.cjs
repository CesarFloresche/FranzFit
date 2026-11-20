require('dotenv').config();

function readInteger(value, fallback, name) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} debe ser un entero positivo.`);
  }
  return parsed;
}

function readConfig(env = process.env) {
  return {
    port: readInteger(env.PORT, 3000, 'PORT'),
    mysql: {
      host: env.MYSQL_HOST || '127.0.0.1',
      port: readInteger(env.MYSQL_PORT, 3306, 'MYSQL_PORT'),
      user: env.MYSQL_USER || 'root',
      password: env.MYSQL_PASSWORD || '',
      database: env.MYSQL_DATABASE || 'franzfit',
      connectionLimit: readInteger(env.MYSQL_CONNECTION_LIMIT, 10, 'MYSQL_CONNECTION_LIMIT'),
    },
    ollamaBaseUrl: (env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/+$/, ''),
    ollamaModel: env.OLLAMA_MODEL || 'gemma3:latest',
    ollamaTimeoutMs: readInteger(env.OLLAMA_TIMEOUT_MS, 90000, 'OLLAMA_TIMEOUT_MS'),
  };
}

module.exports = { readConfig };
