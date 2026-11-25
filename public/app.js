const healthBadge = document.getElementById('health-badge');
const taskForm = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const priorityInput = document.getElementById('task-priority');
const descriptionInput = document.getElementById('task-description');
const formFeedback = document.getElementById('form-feedback');
const taskList = document.getElementById('task-list');

const filterSearch = document.getElementById('filter-search');
const filterStatus = document.getElementById('filter-status');
const filterPriority = document.getElementById('filter-priority');

const statTotal = document.getElementById('stat-total');
const statPending = document.getElementById('stat-pending');
const statProgress = document.getElementById('stat-progress');
const statDone = document.getElementById('stat-done');
const statRate = document.getElementById('stat-rate');

const PRIORITY_LABELS = {
  low: 'Prioridad baja',
  medium: 'Prioridad media',
  high: 'Prioridad alta'
};

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function setFeedback(message, isSuccess = false) {
  formFeedback.textContent = message;
  formFeedback.className = isSuccess ? 'feedback success' : 'feedback';
}

async function checkHealth() {
  try {
    const response = await fetch('/api/health');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    healthBadge.textContent = `API activa (${data.environment})`;
    healthBadge.className = 'health-badge health-ok';
  } catch {
    healthBadge.textContent = 'API sin conexión';
    healthBadge.className = 'health-badge health-error';
  }
}

function renderStats(stats) {
  statTotal.textContent = String(stats.total);
  statPending.textContent = String(stats.pending);
  statProgress.textContent = String(stats.in_progress);
  statDone.textContent = String(stats.done);
  statRate.textContent = `${stats.completionRate}%`;
}

function renderTasks(tasks) {
  if (!tasks.length) {
    taskList.innerHTML =
      '<div class="empty-state">No hay tareas que coincidan con los filtros actuales.</div>';
    return;
  }

  taskList.innerHTML = tasks
    .map(
      (task) => `
      <article class="task-item" data-id="${task.id}">
        <div class="task-info">
          <h3 class="task-title">${escapeHtml(task.title)}</h3>
          ${task.description ? `<p class="task-desc">${escapeHtml(task.description)}</p>` : ''}
          <div class="task-meta">
            <span class="pill priority-${escapeHtml(task.priority)}">
              ${escapeHtml(PRIORITY_LABELS[task.priority] ?? task.priority)}
            </span>
            <span>ID #${task.id}</span>
          </div>
        </div>
        <div class="task-controls">
          <select class="status-select" data-id="${task.id}" aria-label="Estado de la tarea">
            <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>Pendiente</option>
            <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>En progreso</option>
            <option value="done" ${task.status === 'done' ? 'selected' : ''}>Completada</option>
          </select>
          <button type="button" class="btn btn-danger delete-btn" data-id="${task.id}">
            Eliminar
          </button>
        </div>
      </article>
    `
    )
    .join('');
}

async function loadTasks() {
  const params = new URLSearchParams();
  if (filterStatus.value) params.set('status', filterStatus.value);
  if (filterPriority.value) params.set('priority', filterPriority.value);
  if (filterSearch.value.trim()) params.set('search', filterSearch.value.trim());

  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`/api/tasks${query}`);
  const data = await response.json();

  if (!response.ok) {
    setFeedback(data.error || 'No fue posible cargar las tareas.');
    return;
  }

  renderStats(data.stats);
  renderTasks(data.tasks);
}

taskForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setFeedback('');

  const payload = {
    title: titleInput.value,
    priority: priorityInput.value,
    description: descriptionInput.value
  };

  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      const detail = Array.isArray(data.details) && data.details.length ? data.details[0] : data.error;
      setFeedback(detail || 'Error al crear la tarea.');
      return;
    }

    taskForm.reset();
    priorityInput.value = 'medium';
    setFeedback('Tarea agregada correctamente.', true);
    await loadTasks();
  } catch {
    setFeedback('Error de red al comunicarse con el servidor.');
  }
});

taskList.addEventListener('change', async (event) => {
  const select = event.target.closest('.status-select');
  if (!select) return;

  const id = select.dataset.id;
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: select.value })
  });

  if (response.ok) {
    await loadTasks();
  }
});

taskList.addEventListener('click', async (event) => {
  const button = event.target.closest('.delete-btn');
  if (!button) return;

  const id = button.dataset.id;
  const response = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  if (response.ok) {
    await loadTasks();
  }
});

filterSearch.addEventListener('input', loadTasks);
filterStatus.addEventListener('change', loadTasks);
filterPriority.addEventListener('change', loadTasks);

checkHealth();
loadTasks();
