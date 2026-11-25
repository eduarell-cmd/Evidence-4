import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { env as defaultEnv } from './config/env.js';
import { createTaskStore, NotFoundError, ValidationError } from './services/taskService.js';
import { createTaskRouter } from './routes/taskRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_SEED_TASKS = [
  {
    title: 'Configurar pruebas unitarias con Vitest',
    description: 'Cubrir casos normales, extremos e inválidos en la lógica y API.',
    priority: 'high',
    status: 'done'
  },
  {
    title: 'Validar flujo de GitHub Actions en PR hacia main',
    description: 'Confirmar que las pruebas se ejecutan automáticamente en cada PR.',
    priority: 'high',
    status: 'in_progress'
  },
  {
    title: 'Documentar procedimiento de despliegue y rollback',
    description: 'Completar las 5 etapas en docs/DEPLOYMENT.md.',
    priority: 'medium',
    status: 'pending'
  }
];

/**
 * Creates a configured Express application instance.
 * @param {{ taskStore?: ReturnType<typeof createTaskStore>, config?: typeof defaultEnv, seed?: boolean }} [options]
 */
export function createApp(options = {}) {
  const config = options.config ?? defaultEnv;
  const taskStore =
    options.taskStore ?? createTaskStore(options.seed === false ? [] : DEFAULT_SEED_TASKS);

  const app = express();
  app.disable('x-powered-by');

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');

    if (config.corsOrigin) {
      res.setHeader('Access-Control-Allow-Origin', config.corsOrigin);
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
      }
    }
    return next();
  });

  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: config.appName,
      environment: config.nodeEnv,
      timestamp: new Date().toISOString()
    });
  });

  app.use('/api', createTaskRouter(taskStore));

  app.use('/api', (req, res) => {
    res.status(404).json({
      error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
    });
  });

  const publicDir = path.resolve(__dirname, '../public');
  app.use(express.static(publicDir));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof SyntaxError && err.type === 'entity.parse.failed') {
      return res.status(400).json({
        error: 'JSON malformado en el cuerpo de la solicitud.'
      });
    }

    if (err instanceof ValidationError) {
      return res.status(err.statusCode).json({
        error: err.message,
        details: err.details
      });
    }

    if (err instanceof NotFoundError) {
      return res.status(err.statusCode).json({
        error: err.message
      });
    }

    return res.status(500).json({
      error: 'Error interno del servidor.'
    });
  });

  return app;
}
