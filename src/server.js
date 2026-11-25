import { env } from './config/env.js';
import { createApp } from './app.js';

const app = createApp({ config: env });

const server = app.listen(env.port, () => {
  console.log(`[${env.appName}] Servidor escuchando en http://localhost:${env.port} (${env.nodeEnv})`);
});

function shutdown(signal) {
  console.log(`[${env.appName}] Señal ${signal} recibida. Cerrando servidor...`);
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
