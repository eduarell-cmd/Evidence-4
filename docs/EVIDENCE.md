# Evidencias — Evidence 4: Test and Release a Web App

Este documento consolida las capturas de pantalla y registros de cada punto evaluado.

---

## 1. Repositorio en GitHub con README

- **URL del repositorio:** https://github.com/eduarell-cmd/Evidence-4
- **Captura:** _(adjunta captura de la página principal del repo mostrando el README renderizado)_

---

## 2. Pruebas unitarias pasando (14/14)

- **Comando ejecutado:** `npm.cmd test`
- **Resultado:** `Test Files 2 passed (2) | Tests 14 passed (14)`
- **Captura:** _(adjunta captura de la terminal con el resultado de vitest run)_

---

## 3. GitHub Actions — Workflow en verde

- **URL de Actions:** https://github.com/eduarell-cmd/Evidence-4/actions
- **Job:** `test-and-build` sobre `ubuntu-latest` / Node.js 20
- **Captura:** _(adjunta captura del workflow verde en la pestaña Actions)_

---

## 4. Protección de rama `main`

- **Configuración aplicada:**
  - Require pull request before merging ✅
  - Required approvals: 1 ✅
  - Required status check: `test-and-build` ✅
  - Do not allow bypassing ✅
- **Captura:** _(adjunta captura de Settings → Branches mostrando la regla activa)_
- **Evidencia adicional:** push directo a `main` rechazado con `GH006: Protected branch update failed`

---

## 5. Pull Request bloqueado por prueba fallida

### 5a. PR bloqueado (check en rojo)

- **PR #1:** https://github.com/eduarell-cmd/Evidence-4/pull/1
- **Commit con error:** `37f07b6` — `test-demo: introduce validation regression to demonstrate blocked PR`
- **Resultado de pruebas:** `1 failed | 13 passed` — falla en prueba de longitudes límite exactas
- **Captura:** _(adjunta la captura del PR con el check `test-and-build` en rojo y el botón Merge bloqueado)_

### 5b. PR corregido y mergeado (check en verde)

- **Commit de corrección:** `1be42bb` — `fix: restore minimum title length validation`
- **Resultado de pruebas:** `14 passed (14)`
- **Merge commit en main:** `ee50717`
- **Captura:** _(adjunta la captura del PR con check en verde, aprobación y merge realizado)_

---

## 6. Despliegue en producción (5 etapas)

- **Plataforma:** Render (Web Service)
- **URL pública:** https://evidence-4.onrender.com/
- **Commit desplegado:** `0327a1a`

| Verificación | Resultado |
|---|---|
| `GET /api/health` | `200 OK` → `{"status":"ok","service":"TaskFlow","environment":"production"}` |
| `GET /api/tasks` | `200 OK` → 3 tareas, stats funcionales |
| `GET /` | `200 OK` → HTML cargado (`text/html; charset=UTF-8`) |

- **Captura:** _(adjunta captura del deploy activo en Render y de la interfaz web cargada en el navegador)_

---

## 7. Bitácora de desarrollo

- **Archivo:** [docs/DEVELOPMENT_LOG.md](./DEVELOPMENT_LOG.md)
- **Entradas documentadas:** 10 entradas fechadas (2026-11-24), con actividades reales, commits, URLs, problemas y soluciones.

---

## 8. Seguridad

- `.gitignore` excluye `node_modules/`, `.env*`, `*.pem`, `*.key`, `dist/`, `coverage/` y logs.
- `.env.example` sin credenciales reales.
- Cabeceras de seguridad HTTP activas: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`.
- `x-powered-by` deshabilitado (`app.disable('x-powered-by')`).
