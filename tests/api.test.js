import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('API REST TaskFlow - pruebas de integración', () => {
  let app;

  beforeEach(() => {
    app = createApp({
      seed: false,
      config: {
        port: 3000,
        nodeEnv: 'test',
        appName: 'TaskFlow',
        corsOrigin: ''
      }
    });
  });

  it('GET /api/health responde 200 con estado ok y cabeceras de seguridad', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('TaskFlow');
    expect(res.body.environment).toBe('test');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
  });

  it('ejecuta ciclo CRUD completo mediante POST, GET, PATCH y DELETE', async () => {
    const createRes = await request(app).post('/api/tasks').send({
      title: 'Configurar protección de main',
      description: 'Requerir PR y 1 aprobación',
      priority: 'high'
    });

    expect(createRes.status).toBe(201);
    const taskId = createRes.body.task.id;
    expect(createRes.body.task.status).toBe('pending');

    const listRes = await request(app).get('/api/tasks');
    expect(listRes.status).toBe(200);
    expect(listRes.body.tasks).toHaveLength(1);
    expect(listRes.body.stats.total).toBe(1);

    const patchRes = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .send({ status: 'done' });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.task.status).toBe('done');

    const deleteRes = await request(app).delete(`/api/tasks/${taskId}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.deleted).toBe(true);
  });

  it('filtra tareas por query params y sirve la interfaz HTML en /', async () => {
    await request(app).post('/api/tasks').send({ title: 'Prueba CI', priority: 'high' });
    await request(app).post('/api/tasks').send({ title: 'Otra tarea', priority: 'low' });

    const filteredRes = await request(app).get('/api/tasks?priority=high&search=CI');
    expect(filteredRes.status).toBe(200);
    expect(filteredRes.body.tasks).toHaveLength(1);
    expect(filteredRes.body.tasks[0].title).toBe('Prueba CI');

    const homeRes = await request(app).get('/');
    expect(homeRes.status).toBe(200);
    expect(homeRes.headers['content-type']).toContain('text/html');
  });

  it('devuelve 400 ante datos inválidos o JSON malformado', async () => {
    const invalidRes = await request(app)
      .post('/api/tasks')
      .send({ title: 'ab', priority: 'critical' });

    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.error).toBeTruthy();
    expect(Array.isArray(invalidRes.body.details)).toBe(true);

    const malformedRes = await request(app)
      .post('/api/tasks')
      .set('Content-Type', 'application/json')
      .send('{"title": "incompleto"');

    expect(malformedRes.status).toBe(400);
    expect(malformedRes.body.error).toContain('JSON malformado');
  });

  it('devuelve 404 para tareas o endpoints inexistentes y 400 para filtros inválidos', async () => {
    const missingTask = await request(app).get('/api/tasks/9999');
    expect(missingTask.status).toBe(404);

    const unknownRoute = await request(app).get('/api/no-existe');
    expect(unknownRoute.status).toBe(404);

    const invalidFilter = await request(app).get('/api/tasks?status=broken');
    expect(invalidFilter.status).toBe(400);
  });
});
