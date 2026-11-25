import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTaskStore,
  validateTaskInput,
  ValidationError,
  NotFoundError,
  TITLE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH
} from '../src/services/taskService.js';

describe('taskService - pruebas unitarias', () => {
  let store;

  beforeEach(() => {
    store = createTaskStore();
  });

  // --- CASOS NORMALES ---
  it('crea una tarea válida con valores por defecto y timestamps ISO', () => {
    const task = store.create({ title: 'Implementar pruebas unitarias' });

    expect(task.id).toBe(1);
    expect(task.title).toBe('Implementar pruebas unitarias');
    expect(task.description).toBe('');
    expect(task.priority).toBe('medium');
    expect(task.status).toBe('pending');
    expect(Number.isNaN(Date.parse(task.createdAt))).toBe(false);
    expect(Number.isNaN(Date.parse(task.updatedAt))).toBe(false);
  });

  it('filtra tareas por estado, prioridad y búsqueda y calcula estadísticas', () => {
    store.create({ title: 'Configurar CI', priority: 'high', status: 'done' });
    store.create({
      title: 'Escribir README',
      description: 'Incluir pasos de despliegue',
      priority: 'medium',
      status: 'in_progress'
    });
    store.create({ title: 'Revisar .gitignore', priority: 'low', status: 'pending' });

    expect(store.list({ status: 'done' })).toHaveLength(1);
    expect(store.list({ priority: 'medium' })).toHaveLength(1);
    expect(store.list({ search: 'despliegue' })).toHaveLength(1);

    const stats = store.getStats();
    expect(stats).toEqual({
      total: 3,
      pending: 1,
      in_progress: 1,
      done: 1,
      completionRate: 33
    });
  });

  it('actualiza parcialmente una tarea existente y permite eliminarla', () => {
    const created = store.create({ title: 'Preparar release', priority: 'low' });
    const updated = store.update(created.id, { status: 'done', priority: 'high' });

    expect(updated.id).toBe(created.id);
    expect(updated.title).toBe('Preparar release');
    expect(updated.status).toBe('done');
    expect(updated.priority).toBe('high');
    expect(updated.createdAt).toBe(created.createdAt);

    const removed = store.remove(created.id);
    expect(removed.id).toBe(created.id);
    expect(store.list()).toEqual([]);
  });

  // --- CASOS EXTREMOS ---
  it('recorta espacios y acepta longitudes límite exactas (3 y 100 en título, 500 en descripción)', () => {
    const minValid = validateTaskInput({ title: '  API  ' });
    expect(minValid.title).toBe('API');

    const maxTitle = 'A'.repeat(TITLE_MAX_LENGTH);
    const maxDesc = 'B'.repeat(DESCRIPTION_MAX_LENGTH);
    const maxValid = validateTaskInput({ title: maxTitle, description: maxDesc });

    expect(maxValid.title).toHaveLength(TITLE_MAX_LENGTH);
    expect(maxValid.description).toHaveLength(DESCRIPTION_MAX_LENGTH);
  });

  it('devuelve lista vacía y completionRate en 0 cuando el almacén está vacío', () => {
    expect(store.list()).toEqual([]);
    expect(store.getStats()).toEqual({
      total: 0,
      pending: 0,
      in_progress: 0,
      done: 0,
      completionRate: 0
    });
  });

  it('maneja búsqueda insensible a mayúsculas con espacios y sin coincidencias', () => {
    store.create({ title: 'Desplegar en Render', description: 'Servicio Node.js' });

    expect(store.list({ search: '  RENDER  ' })).toHaveLength(1);
    expect(store.list({ search: 'inexistente-xyz' })).toEqual([]);
  });

  // --- CASOS INVÁLIDOS ---
  it('rechaza títulos vacíos, solo espacios, muy cortos, muy largos o de tipo incorrecto', () => {
    expect(() => store.create({})).toThrow(ValidationError);
    expect(() => store.create({ title: '   ' })).toThrow(ValidationError);
    expect(() => store.create({ title: 'ab' })).toThrow(ValidationError);
    expect(() => store.create({ title: 'x'.repeat(TITLE_MAX_LENGTH + 1) })).toThrow(ValidationError);
    expect(() => store.create({ title: 12345 })).toThrow(ValidationError);
  });

  it('rechaza prioridad inválida, estado inválido, descripción excesiva o actualización vacía', () => {
    const created = store.create({ title: 'Tarea base válida' });

    expect(() => store.create({ title: 'Válida', priority: 'urgent' })).toThrow(ValidationError);
    expect(() => store.create({ title: 'Válida', status: 'archived' })).toThrow(ValidationError);
    expect(() =>
      store.create({ title: 'Válida', description: 'z'.repeat(DESCRIPTION_MAX_LENGTH + 1) })
    ).toThrow(ValidationError);
    expect(() => store.update(created.id, {})).toThrow(ValidationError);
  });

  it('lanza ValidationError con IDs inválidos y NotFoundError con IDs inexistentes', () => {
    expect(() => store.getById('abc')).toThrow(ValidationError);
    expect(() => store.getById(0)).toThrow(ValidationError);
    expect(() => store.update(-5, { status: 'done' })).toThrow(ValidationError);

    expect(() => store.getById(999)).toThrow(NotFoundError);
    expect(() => store.update(999, { status: 'done' })).toThrow(NotFoundError);
    expect(() => store.remove(999)).toThrow(NotFoundError);
  });
});
