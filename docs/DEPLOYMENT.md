# Guía de Despliegue — TaskFlow (5 Etapas)

Este documento describe el proceso completo de liberación de **TaskFlow** siguiendo las cinco etapas estándar: **Before**, **Deploy**, **Verify**, **Roll Back** y **Record**.

---

## 1. Before (Pre-despliegue)

Antes de publicar una nueva versión en producción, verifica cada punto en orden:

1. **Rama y CI en verde:**
   - Asegúrate de estar sobre `main` actualizado (`git checkout main && git pull origin main`).
   - Confirma en GitHub Actions que el workflow `CI - Tests and Build` (`test-and-build`) pasó en el último commit de `main`.
2. **Validación local limpia:**
   ```bash
   npm install
   npm test
   npm run build
   ```
   - Todas las pruebas deben pasar y `dist/` debe generarse sin errores de sintaxis.
3. **Configuración y seguridad:**
   - Revisa que `.env` y cualquier secreto estén excluidos por `.gitignore` (`git status` no debe mostrar archivos sensibles).
   - Define las variables de entorno requeridas en el entorno destino:
     - `NODE_ENV=production`
     - `PORT` (asignado automáticamente por el proveedor o `3000` en servidor propio)
     - `APP_NAME=TaskFlow`
     - `CORS_ORIGIN` (opcional, si otro dominio consume la API)

---

## 2. Deploy (Despliegue)

### Opción A: Despliegue en Render (Web Service conectado a GitHub)

1. Inicia sesión en [Render](https://render.com) y selecciona **New + -> Web Service**.
2. Conecta el repositorio `eduarell-cmd/Evidence-4` y selecciona la rama **`main`**.
3. Configura los parámetros del servicio:
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
4. En **Environment Variables**, agrega:
   - `NODE_ENV` = `production`
   - `APP_NAME` = `TaskFlow`
5. Haz clic en **Create Web Service** y espera a que el log muestre:
   `[TaskFlow] Servidor escuchando en http://localhost:<PORT> (production)`.

### Opción B: Ejecución en modo producción local o VPS

```bash
npm ci --omit=dev
npm run build
NODE_ENV=production PORT=3000 APP_NAME=TaskFlow npm start
```

En PowerShell (Windows):

```powershell
$env:NODE_ENV="production"
$env:PORT="3000"
$env:APP_NAME="TaskFlow"
npm start
```

---

## 3. Verify (Verificación post-despliegue)

Sustituye `<URL_BASE>` por tu URL pública de Render (por ejemplo `https://taskflow-evidence4.onrender.com`) o `http://localhost:3000` si validas en local:

1. **Verificar salud del servicio (`GET /api/health`):**
   ```bash
   curl -i <URL_BASE>/api/health
   ```
   Resultado esperado: código `200 OK` y JSON con `"status": "ok"`, `"service": "TaskFlow"`, `"environment": "production"`.

2. **Verificar interfaz web (`GET /`):**
   Abre `<URL_BASE>/` en el navegador y confirma que:
   - El indicador superior muestra `API activa (production)`.
   - Se muestran las tarjetas de resumen y las tareas iniciales.

3. **Verificar lectura y escritura en la API (`GET` y `POST /api/tasks`):**
   ```bash
   curl -s <URL_BASE>/api/tasks
   curl -i -X POST <URL_BASE>/api/tasks \
     -H "Content-Type: application/json" \
     -d '{"title":"Verificación post-despliegue","priority":"high"}'
   ```
   Resultado esperado: `201 Created` con el objeto de la tarea creada. (Luego puedes eliminar la tarea de prueba desde la interfaz o con `DELETE /api/tasks/<id>`).

4. **Revisar logs del servidor:**
   Confirma en el panel de logs del proveedor (o consola) que no existan excepciones `500` ni reinicios inesperados.

---

## 4. Roll Back (Reversión ante fallos)

Si alguna comprobación en **Verify** falla (errores `500`, caída del `/api/health` o fallo visual crítico):

### En Render (reversión inmediata sin tocar código)
1. Abre el servicio en el panel de Render -> pestaña **Events** / **Deploys**.
2. Ubica el último despliegue estable anterior y selecciona **Rollback to this deploy** (o **Redeploy** sobre ese commit).
3. Ejecuta nuevamente los pasos de **Verify** sobre el despliegue restaurado.

### En Git / GitHub (reversión controlada mediante Pull Request)
1. Identifica el commit problemático en `main`:
   ```bash
   git log --oneline -n 5
   ```
2. Crea una rama de reversión y revierte el commit (sin reescribir historia):
   ```bash
   git checkout -b fix/rollback-release
   git revert <COMMIT_SHA> --no-edit
   git push -u origin fix/rollback-release
   ```
3. Abre un Pull Request hacia `main`, verifica que `test-and-build` pase en GitHub Actions, obtén la aprobación requerida y fusiona.
4. Confirma que el proveedor redesplegó la versión estable y repite **Verify**.

---

## 5. Record (Registro de la liberación)

Después de completar una liberación exitosa (o un rollback), registra la evidencia real:

1. Etiqueta la versión en Git (opcional, una vez en `main`):
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0 - Evidence 4"
   git push origin v1.0.0
   ```
2. Documenta en [docs/DEVELOPMENT_LOG.md](./DEVELOPMENT_LOG.md):
   - Fecha y hora del despliegue.
   - Commit SHA desplegado (`git rev-parse --short HEAD`).
   - URL pública o entorno verificado.
   - Resultado real de `/api/health` y pruebas funcionales.
   - Capturas o enlaces de respaldo sin alterar datos reales.
