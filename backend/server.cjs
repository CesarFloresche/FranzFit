const { createApp } = require('./app.cjs');
const { readConfig } = require('./config.cjs');
const { createDatabasePool } = require('./database.cjs');

const config = readConfig();
const pool = createDatabasePool(config.mysql);
const server = createApp({ pool, config }).listen(config.port, () => {
  console.log(`FranzFit API escuchando en http://localhost:${config.port}`);
  console.log(`Modelo Ollama configurado: ${config.ollamaModel}`);
});

function shutdown() {
  server.close(() => {
    pool.end()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('No se pudo cerrar el pool MySQL correctamente.', error);
        process.exit(1);
      });
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
