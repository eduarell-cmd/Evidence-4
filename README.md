# TaskFlow — Evidence 4: Test and Release a Web App

Aplicación web full-stack con API REST para gestionar tareas y entregas, preparada con pruebas automatizadas, integración continua en GitHub Actions, reglas de protección de rama, guía de despliegue en 5 etapas y bitácora de desarrollo.

## Tecnologías utilizadas

- **Runtime:** Node.js (`>= 20.0.0`, ES Modules)
- **Backend:** Express `^4.21.2`, `dotenv ^16.4.7`
- **Frontend:** HTML5, CSS3 y JavaScript modular (`public/`)
- **Pruebas:** Vitest `^2.1.8` y Supertest `^7.0.0`
- **CI/CD:** GitHub Actions (`.github/workflows/tests.yml`)

## Estructura del proyecto

```text
.
├── .github/
│   ├── workflows/tests.yml         # Pipeline CI en push y PR hacia main
│   └── PULL_REQUEST_TEMPLATE.md    # Checklist obligatorio para PRs
├── docs/
│   ├── BRANCH_PROTECTION.md        # Configuración manual de protección de main
│   ├── DEPLOYMENT.md               # Guía de despliegue en 5 etapas
│   ├── DEVELOPMENT_LOG.md          # Bitácora de desarrollo (8+ entradas)
│   └── PR_BLOCKED_PROCEDURE.md     # Procedimiento real de PR bloqueado y corregido
├── public/
│   ├── index.html                  # Interfaz web
│   ├── styles.css                  # Estilos responsivos
│   └── app.js                      # Cliente JS conectado a la API REST
├── scripts/
│   └── build.js                    # Verificación de sintaxis y generación de dist/
├── src/
│   ├── config/env.js               # Lectura y validación de variables de entorno
│   ├── routes/taskRoutes.js        # Endpoints REST /api/tasks
│   ├── services/taskService.js     # Lógica de negocio y validaciones
│   ├── app.js                      # Factoría de la app Express y manejo de errores
│   └── server.js                   # Arranque del servidor HTTP
├── tests/
│   ├── taskService.test.js         # Pruebas unitarias (normales, extremos e inválidos)
│   └── api.test.js                 # Pruebas de integración HTTP con Supertest
├── .env.example                    # Plantilla segura de variables de entorno
├── .gitignore                      # Exclusión de dependencias, secretos y artefactos
├── package.json
└── vitest.config.js
```

## Requisitos previos

- **Node.js 20 LTS o superior** y **npm** instalados localmente.
- **Git** configurado con tu `user.name` y `user.email`.
- Cuenta en **GitHub** con acceso al repositorio `https://github.com/eduarell-cmd/Evidence-4.git`.

## Instalación desde cero

1. Clona el repositorio (o ubícate en la carpeta del proyecto):
   ```bash
   git clone https://github.com/eduarell-cmd/Evidence-4.git
   cd Evidence-4
   ```
2. Crea tu archivo `.env` local a partir de la plantilla segura (opcional si usas los valores por defecto):
   ```bash
   cp .env.example .env
   ```
   En PowerShell:
   ```powershell
   Copy-Item .env.example .env
   ```
3. Instala las dependencias:
   ```bash
   npm install
   ```

## Ejecución

- **Modo desarrollo (recarga automática):**
  ```bash
  npm run dev
  ```
- **Modo producción / estándar:**
  ```bash
  npm start
  ```
- **Build de verificación y empaquetado (`dist/`):**
  ```bash
  npm run build
  ```

Una vez iniciado el servidor, abre `http://localhost:3000` en tu navegador.

### Endpoints disponibles

- `GET /api/health` — Estado del servicio, entorno y marca de tiempo.
- `GET /api/tasks` — Lista tareas (filtros opcionales: `status`, `priority`, `search`) y estadísticas (`stats`).
- `GET /api/tasks/:id` — Obtiene una tarea por su ID numérico positivo.
- `POST /api/tasks` — Crea una tarea (`title` obligatorio de 3–100 caracteres, `description` opcional de máx. 500, `priority`: `low|medium|high`, `status`: `pending|in_progress|done`).
- `PATCH /api/tasks/:id` — Actualiza parcialmente una tarea existente.
- `DELETE /api/tasks/:id` — Elimina una tarea por ID.

## Pruebas automatizadas

Ejecuta toda la suite de pruebas unitarias y de integración:

```bash
npm test
```

Para ejecutarlas en modo observador durante el desarrollo:

```bash
npm run test:watch
```

Las pruebas cubren:
- **Casos normales:** creación con valores por defecto, filtrado por estado/prioridad/búsqueda, cálculo de estadísticas, ciclo CRUD completo y `/api/health`.
- **Casos extremos:** recorte de espacios en blanco, longitudes límite exactas (3 y 100 caracteres en título, 500 en descripción), almacén vacío sin división por cero, búsqueda insensible a mayúsculas.
- **Casos inválidos:** títulos ausentes/vacíos/cortos/largos/no-string, prioridades o estados no permitidos, actualizaciones vacías, JSON malformado (`400`), IDs inválidos (`400`) y recursos inexistentes (`404`).

## Integración continua, protección de rama y evidencias

- **GitHub Actions:** [.github/workflows/tests.yml](.github/workflows/tests.yml) ejecuta `npm test` y `npm run build` automáticamente en cada `push` y `pull_request` hacia `main`.
- **Protección de `main`:** consulta [docs/BRANCH_PROTECTION.md](docs/BRANCH_PROTECTION.md).
- **Demo de PR bloqueado y corregido:** consulta [docs/PR_BLOCKED_PROCEDURE.md](docs/PR_BLOCKED_PROCEDURE.md).
- **Despliegue (5 etapas):** consulta [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
- **Bitácora de desarrollo:** consulta [docs/DEVELOPMENT_LOG.md](docs/DEVELOPMENT_LOG.md).

## Seguridad

- `.gitignore` excluye `node_modules/`, `.env`, `.env.local`, `.env.*.local`, `*.pem`, `*.key`, `dist/`, `coverage/` y logs.
- No se almacenan contraseñas, tokens ni credenciales en el código fuente; usa `.env.example` como referencia de configuración.
