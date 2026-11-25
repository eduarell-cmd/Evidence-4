export const VALID_STATUSES = Object.freeze(['pending', 'in_progress', 'done']);
export const VALID_PRIORITIES = Object.freeze(['low', 'medium', 'high']);
export const TITLE_MIN_LENGTH = 3;
export const TITLE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;

export class ValidationError extends Error {
  /**
   * @param {string} message
   * @param {string[]} [details]
   */
  constructor(message, details = []) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.details = details;
  }
}

export class NotFoundError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

/**
 * Validates and sanitizes task payload for creation or partial update.
 * @param {unknown} payload
 * @param {{ partial?: boolean }} [options]
 * @returns {{ title?: string, description?: string, priority?: string, status?: string }}
 */
export function validateTaskInput(payload, { partial = false } = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ValidationError('El cuerpo de la solicitud debe ser un objeto JSON válido.');
  }

  const errors = [];
  const sanitized = {};

  if (!partial || payload.title !== undefined) {
    if (typeof payload.title !== 'string') {
      errors.push('El campo "title" es obligatorio y debe ser una cadena de texto.');
    } else {
      const trimmedTitle = payload.title.trim();
      if (trimmedTitle.length < TITLE_MIN_LENGTH + 5 || trimmedTitle.length > TITLE_MAX_LENGTH) {
        errors.push(
          `El título debe tener entre ${TITLE_MIN_LENGTH} y ${TITLE_MAX_LENGTH} caracteres.`
        );
      } else {
        sanitized.title = trimmedTitle;
      }
    }
  }

  if (payload.description !== undefined) {
    if (typeof payload.description !== 'string') {
      errors.push('El campo "description" debe ser una cadena de texto.');
    } else {
      const trimmedDescription = payload.description.trim();
      if (trimmedDescription.length > DESCRIPTION_MAX_LENGTH) {
        errors.push(`La descripción no puede superar los ${DESCRIPTION_MAX_LENGTH} caracteres.`);
      } else {
        sanitized.description = trimmedDescription;
      }
    }
  } else if (!partial) {
    sanitized.description = '';
  }

  if (payload.priority !== undefined) {
    if (typeof payload.priority !== 'string' || !VALID_PRIORITIES.includes(payload.priority)) {
      errors.push(`La prioridad debe ser una de: ${VALID_PRIORITIES.join(', ')}.`);
    } else {
      sanitized.priority = payload.priority;
    }
  } else if (!partial) {
    sanitized.priority = 'medium';
  }

  if (payload.status !== undefined) {
    if (typeof payload.status !== 'string' || !VALID_STATUSES.includes(payload.status)) {
      errors.push(`El estado debe ser uno de: ${VALID_STATUSES.join(', ')}.`);
    } else {
      sanitized.status = payload.status;
    }
  } else if (!partial) {
    sanitized.status = 'pending';
  }

  if (errors.length > 0) {
    throw new ValidationError('Datos de tarea inválidos.', errors);
  }

  if (partial && Object.keys(sanitized).length === 0) {
    throw new ValidationError(
      'Debes enviar al menos un campo actualizable (title, description, priority, status).'
    );
  }

  return sanitized;
}

function parsePositiveId(rawId) {
  const numericId = Number(rawId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new ValidationError('El identificador de la tarea debe ser un entero positivo.');
  }
  return numericId;
}

/**
 * Creates an isolated in-memory task store for the API and unit tests.
 * @param {Array<{ title: string, description?: string, priority?: string, status?: string }>} [seedTasks]
 */
export function createTaskStore(seedTasks = []) {
  const tasks = new Map();
  let nextId = 1;

  for (const seed of seedTasks) {
    const validated = validateTaskInput(seed, { partial: false });
    const now = new Date().toISOString();
    const task = {
      id: nextId++,
      ...validated,
      createdAt: now,
      updatedAt: now
    };
    tasks.set(task.id, task);
  }

  return {
    /**
     * Lists tasks optionally filtered by status, priority, and text search.
     * @param {{ status?: string, priority?: string, search?: string }} [filters]
     */
    list(filters = {}) {
      const { status, priority, search } = filters;

      if (status !== undefined && status !== '' && !VALID_STATUSES.includes(status)) {
        throw new ValidationError(`Filtro de estado inválido. Valores permitidos: ${VALID_STATUSES.join(', ')}.`);
      }
      if (priority !== undefined && priority !== '' && !VALID_PRIORITIES.includes(priority)) {
        throw new ValidationError(
          `Filtro de prioridad inválido. Valores permitidos: ${VALID_PRIORITIES.join(', ')}.`
        );
      }

      const normalizedSearch = typeof search === 'string' ? search.trim().toLowerCase() : '';

      return Array.from(tasks.values())
        .filter((task) => {
          if (status && task.status !== status) return false;
          if (priority && task.priority !== priority) return false;
          if (normalizedSearch) {
            const matchesTitle = task.title.toLowerCase().includes(normalizedSearch);
            const matchesDesc = task.description.toLowerCase().includes(normalizedSearch);
            if (!matchesTitle && !matchesDesc) return false;
          }
          return true;
        })
        .sort((a, b) => b.id - a.id)
        .map((task) => ({ ...task }));
    },

    /**
     * Finds a task by its positive integer ID.
     * @param {number | string} rawId
     */
    getById(rawId) {
      const id = parsePositiveId(rawId);
      const task = tasks.get(id);
      if (!task) {
        throw new NotFoundError(`No se encontró la tarea con id ${id}.`);
      }
      return { ...task };
    },

    /**
     * Validates and stores a new task.
     * @param {unknown} payload
     */
    create(payload) {
      const data = validateTaskInput(payload, { partial: false });
      const now = new Date().toISOString();
      const task = {
        id: nextId++,
        ...data,
        createdAt: now,
        updatedAt: now
      };
      tasks.set(task.id, task);
      return { ...task };
    },

    /**
     * Partially updates an existing task.
     * @param {number | string} rawId
     * @param {unknown} payload
     */
    update(rawId, payload) {
      const id = parsePositiveId(rawId);
      const existing = tasks.get(id);
      if (!existing) {
        throw new NotFoundError(`No se encontró la tarea con id ${id}.`);
      }

      const updates = validateTaskInput(payload, { partial: true });
      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      tasks.set(id, updated);
      return { ...updated };
    },

    /**
     * Deletes a task by ID and returns the removed record.
     * @param {number | string} rawId
     */
    remove(rawId) {
      const id = parsePositiveId(rawId);
      const existing = tasks.get(id);
      if (!existing) {
        throw new NotFoundError(`No se encontró la tarea con id ${id}.`);
      }
      tasks.delete(id);
      return { ...existing };
    },

    /**
     * Returns summary counts and completion rate across all tasks.
     */
    getStats() {
      const all = Array.from(tasks.values());
      const total = all.length;
      const pending = all.filter((t) => t.status === 'pending').length;
      const in_progress = all.filter((t) => t.status === 'in_progress').length;
      const done = all.filter((t) => t.status === 'done').length;
      const completionRate = total === 0 ? 0 : Math.round((done / total) * 100);

      return { total, pending, in_progress, done, completionRate };
    }
  };
}
