import { Router } from 'express';

/**
 * Mounts REST endpoints for task management.
 * @param {ReturnType<import('../services/taskService.js').createTaskStore>} taskStore
 */
export function createTaskRouter(taskStore) {
  const router = Router();

  router.get('/tasks', (req, res, next) => {
    try {
      const { status, priority, search } = req.query;
      const tasks = taskStore.list({
        status: typeof status === 'string' ? status : undefined,
        priority: typeof priority === 'string' ? priority : undefined,
        search: typeof search === 'string' ? search : undefined
      });
      const stats = taskStore.getStats();
      res.status(200).json({ tasks, stats });
    } catch (error) {
      next(error);
    }
  });

  router.get('/tasks/:id', (req, res, next) => {
    try {
      const task = taskStore.getById(req.params.id);
      res.status(200).json({ task });
    } catch (error) {
      next(error);
    }
  });

  router.post('/tasks', (req, res, next) => {
    try {
      const task = taskStore.create(req.body);
      res.status(201).json({ task });
    } catch (error) {
      next(error);
    }
  });

  router.patch('/tasks/:id', (req, res, next) => {
    try {
      const task = taskStore.update(req.params.id, req.body);
      res.status(200).json({ task });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/tasks/:id', (req, res, next) => {
    try {
      const task = taskStore.remove(req.params.id);
      res.status(200).json({ deleted: true, task });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
