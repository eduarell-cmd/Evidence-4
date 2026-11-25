# Bitácora de Desarrollo — TaskFlow (Evidence 4)

Esta bitácora documenta cronológicamente las actividades realizadas, decisiones técnicas, evidencias reales y problemas encontrados con sus soluciones. Los datos dependientes de acciones pendientes en tu terminal o en GitHub remoto se mantienen explícitamente como `[PENDIENTE: ...]` para no inventar información.

---

## Entrada 1 — Inicialización y diagnóstico del repositorio
- **Fecha:** 2026-11-24
- **Actividad:** Inspección inicial del workspace `c:\Evidence-4` y configuración de Git.
- **Motivo:** Verificar la existencia de código previo, historial de commits y herramientas disponibles antes de construir la aplicación.
- **Evidencia:**
  - `git status` reportó `On branch main / No commits yet`.
  - `.git/config` apunta a `https://github.com/eduarell-cmd/Evidence-4.git`.
- **Problemas y soluciones:**
  - *Problema:* El repositorio estaba completamente vacío (sin archivos previos) y en la terminal del entorno no estaban disponibles `node` ni `python` en el `PATH`.
  - *Solución:* Se confirmó con el usuario crear un nuevo proyecto Node.js + Express + Vitest y preparar todo listo para instalar y validar localmente desde la terminal del usuario.

## Entrada 2 — Definición de arquitectura y seguridad base
- **Fecha:** 2026-11-24
- **Actividad:** Creación de `package.json`, `vitest.config.js`, `.gitignore` y `.env.example`.
- **Motivo:** Establecer la estructura de dependencias mínimas (`express`, `dotenv`, `vitest`, `supertest`), scripts de ejecución/pruebas/build y prevención de fugas de secretos.
- **Evidencia:**
  - Archivos creados: `package.json`, `vitest.config.js`, `.gitignore`, `.env.example`.
  - `.gitignore` excluye `node_modules/`, `.env*`, `*.pem`, `*.key`, `dist/`, `coverage/` y logs.
- **Problemas y soluciones:**
  - *Problema:* Evitar dependencias pesadas o innecesarias que dificulten la instalación desde cero.
  - *Solución:* Se eligió ES Modules nativo (`"type": "module"`) con Node `>=20`, `express`, `dotenv`, `vitest` y `supertest`, más `node --watch` nativo para desarrollo.

## Entrada 3 — Implementación de lógica de negocio y validaciones
- **Fecha:** 2026-11-24
- **Actividad:** Desarrollo de `src/config/env.js` y `src/services/taskService.js`.
- **Motivo:** Separar las reglas de negocio, validación de entradas y almacenamiento en memoria de la capa HTTP para facilitar pruebas unitarias deterministas.
- **Evidencia:**
  - Implementadas validaciones para `title` (3–100 caracteres), `description` (máx. 500), `priority` (`low|medium|high`), `status` (`pending|in_progress|done`), filtros y cálculo de estadísticas (`getStats`).
- **Problemas y soluciones:**
  - *Problema:* En `src/config/env.js`, la opción `{ quiet: true }` en `dotenv.config()` corresponde a versiones más recientes y no a `dotenv@16.x`.
  - *Solución:* Se reemplazó por `dotenv.config();` estándar compatible con `dotenv ^16.4.7`, y se añadió respaldo seguro para puertos inválidos.

## Entrada 4 — Implementación de API REST, servidor y frontend
- **Fecha:** 2026-11-24
- **Actividad:** Desarrollo de `src/routes/taskRoutes.js`, `src/app.js`, `src/server.js`, `scripts/build.js` y la interfaz en `public/`.
- **Motivo:** Exponer los endpoints CRUD y `/api/health`, servir la interfaz web responsiva y contar con un script de build verificable.
- **Evidencia:**
  - Archivos creados: `src/routes/taskRoutes.js`, `src/app.js`, `src/server.js`, `scripts/build.js`, `public/index.html`, `public/styles.css`, `public/app.js`.
- **Problemas y soluciones:**
  - *Problema:* Instanciar el servidor directamente al importar `app` provoca conflictos de puertos durante pruebas concurrentes.
  - *Solución:* Se implementó el patrón factoría `createApp(options)` en `src/app.js`, dejando el `app.listen()` aislado en `src/server.js`, además de manejar JSON malformado (`400`) y rutas inexistentes (`404`).

## Entrada 5 — Creación y ejecución de la suite de pruebas unitarias e integración
- **Fecha:** 2026-11-24
- **Actividad:** Implementación y ejecución de 14 pruebas automatizadas distribuidas en `tests/taskService.test.js` (9 pruebas) y `tests/api.test.js` (5 pruebas).
- **Motivo:** Verificar casos normales, extremos e inválidos tanto en la lógica pura como en los endpoints REST HTTP.
- **Evidencia:**
  - Cobertura implementada para creación, filtrado, límites de longitud, almacén vacío, errores `ValidationError`, `NotFoundError`, JSON malformado y cabeceras de seguridad.
  - Resultado real de `npm.cmd test` (`vitest run`): `Test Files 2 passed (2) | Tests 14 passed (14)` (`tests/taskService.test.js` 9/9 y `tests/api.test.js` 5/5).
- **Problemas y soluciones:**
  - *Problema:* En PowerShell con política `Restricted`, ejecutar `npm` directamente falla por `npm.ps1` deshabilitado; además, las pruebas con Supertest requieren permisos de enlace a puerto local (`127.0.0.1`).
  - *Solución:* Se ejecutó mediante `npm.cmd` (o habilitando `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`) con permisos de red/puerto local, y cada prueba reinicia su instancia mediante `beforeEach` (`createTaskStore()` y `createApp({ seed: false })`).

## Entrada 6 — Configuración de GitHub Actions y plantilla de Pull Request
- **Fecha:** 2026-11-24
- **Actividad:** Creación de `.github/workflows/tests.yml` y `.github/PULL_REQUEST_TEMPLATE.md`.
- **Motivo:** Automatizar la ejecución de pruebas y verificación de build en cada `push` y `pull_request` hacia `main`.
- **Evidencia:**
  - Workflow configurado con job `test-and-build` sobre `ubuntu-latest` y Node.js 20.
  - `[PENDIENTE: Enlace/captura de la primera ejecución de GitHub Actions tras hacer push]`
- **Problemas y soluciones:**
  - *Problema:* Usar `npm ci` o `cache: 'npm'` en `actions/setup-node@v4` falla en GitHub Actions si `package-lock.json` aún no ha sido generado y versionado.
  - *Solución:* El workflow verifica `[ -f package-lock.json ]` para usar `npm ci` cuando exista el lockfile y `npm install` en caso contrario, evitando falsos fallos de CI en el primer push.

## Entrada 7 — Documentación de despliegue, protección de rama y procedimiento de PR bloqueado
- **Fecha:** 2026-11-24
- **Actividad:** Redacción de `README.md`, `docs/DEPLOYMENT.md`, `docs/BRANCH_PROTECTION.md` y `docs/PR_BLOCKED_PROCEDURE.md`.
- **Motivo:** Cumplir con la documentación técnica completa, las cinco etapas de despliegue (Before, Deploy, Verify, Roll Back, Record) y la guía reproducible del PR bloqueado.
- **Evidencia:**
  - Documentos creados y enlazados desde `README.md`.
- **Problemas y soluciones:**
  - *Problema:* GitHub no permite configurar reglas de protección de ramas ni aprobar tus propios PRs desde archivos locales.
  - *Solución:* Se documentaron paso a paso los ajustes manuales en GitHub (`Settings -> Branches`) y la alternativa con colaborador/segunda cuenta para cumplir el mínimo de 1 aprobación.

## Entrada 8 — Validación local completa y preparación del commit inicial en `main`
- **Fecha:** 2026-11-24
- **Actividad:** Instalación desde cero (`npm.cmd install`), ejecución de pruebas (`npm.cmd test`), validación de build (`npm.cmd run build`), prueba del servidor en vivo (`src/server.js`) y verificación de `.gitignore`.
- **Motivo:** Comprobar el funcionamiento real del proyecto desde cero antes de realizar el commit inicial y subirlo a `main`.
- **Evidencia:**
  - `npm.cmd install` instaló `138` paquetes y generó `package-lock.json`.
  - `npm.cmd test` pasó `14/14` pruebas en `2/2` archivos.
  - `npm.cmd run build` generó correctamente `C:\Evidence-4\dist` con verificación de sintaxis exitosa.
  - Servidor en `http://localhost:3000`: `GET /api/health` respondió `{"status":"ok","service":"TaskFlow","environment":"development"}`, `GET /api/tasks` devolvió 3 tareas iniciales y `GET /` respondió HTTP `200`.
  - Hash del commit inicial y push a `main`: `[PENDIENTE: ejecutar git add . / git commit / git push -u origin main]`
- **Problemas y soluciones:**
  - *Problema:* En entornos Windows con `ExecutionPolicy` restringida, `npm` invoca `npm.ps1` y PowerShell lo bloquea.
  - *Solución:* Usar `npm.cmd` en PowerShell o habilitar `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## Entrada 9 — Demostración de Pull Request bloqueado, corrección y fusión
- **Fecha:** 2026-11-24
- **Actividad:** Ejecución del flujo en `docs/PR_BLOCKED_PROCEDURE.md` usando la rama `fix/demo-blocked-pr`.
- **Motivo:** Demostrar en condiciones reales que la integración continua y la protección de `main` impiden fusionar código con pruebas fallidas.
- **Evidencia:**
  - URL del Pull Request: `https://github.com/eduarell-cmd/Evidence-4/pull/1`
  - Commit con error intencional (regresión de validación): `37f07b6` → prueba falló: `1 failed | 13 passed`.
  - Commit con corrección restaurada: `1be42bb` → pruebas pasaron: `14 passed (14)`.
  - Commit de merge en `main`: `ee50717`
- **Problemas y soluciones:**
  - *Problema:* Al revertir el error, el diff neto entre la rama y `main` quedó vacío (`Files changed` sin cambios en GitHub). Esto ocurre porque los dos commits se cancelan.
  - *Solución:* Se incluyó la actualización de la bitácora (`DEVELOPMENT_LOG.md`) en el PR para que haya un cambio real que justifique el merge y la evidencia quede registrada.

## Entrada 10 — Despliegue en producción y verificación final (5 etapas)
- **Fecha:** 2026-11-24
- **Actividad:** Publicación de la aplicación en Render siguiendo `docs/DEPLOYMENT.md` y verificación de los tres puntos de control.
- **Motivo:** Completar la liberación de la aplicación web y registrar el estado verificado de producción.
- **Evidencia:**
  - URL desplegada: `https://evidence-4.onrender.com/`
  - `GET /api/health` → HTTP 200: `{"status":"ok","service":"TaskFlow","environment":"production","timestamp":"2026-11-25T05:54:44.454Z"}`
  - `GET /api/tasks` → 3 tareas, `stats.total: 3`
  - `GET /` → HTTP 200 `text/html; charset=UTF-8` (interfaz web cargada)
  - Commit desplegado en Render: `0327a1a` (Merge PR #2 → `main`)
- **Problemas y soluciones:**
  - *Problema:* El primer despliegue falló con `Root directory 'health' does not exist` porque `/api/health` se colocó en el campo **Root Directory** de Render en lugar del campo **Health Check Path**.
  - *Solución:* Se limpió el campo Root Directory (dejándolo vacío) y se colocó `/api/health` únicamente en Health Check Path. Se disparó un nuevo deploy manual desde el panel de Render y el servicio quedó activo.
