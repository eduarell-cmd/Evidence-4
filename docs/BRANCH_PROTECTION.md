# Configuración de Protección de la Rama `main`

Este documento especifica los requisitos preparados en el repositorio y los pasos manuales exactos que debes aplicar en GitHub para proteger la rama `main`.

## Preparación en el repositorio

- Workflow de verificación automática en [.github/workflows/tests.yml](../.github/workflows/tests.yml):
  - Se ejecuta en cada `push` a `main` y en cada `pull_request` dirigido a `main`.
  - Define el job con nombre exacto **`test-and-build`**, el cual instala dependencias, ejecuta `npm test` (Vitest + Supertest) y valida `npm run build`.
- Plantilla de Pull Request en [.github/PULL_REQUEST_TEMPLATE.md](../.github/PULL_REQUEST_TEMPLATE.md) para estandarizar la revisión antes de fusionar.

## Pasos manuales en GitHub

> **Importante:** Las reglas de protección de ramas se configuran directamente en el repositorio remoto de GitHub después de subir el primer commit a `main` y ejecutar al menos una vez el workflow para que el check `test-and-build` aparezca disponible.

1. Abre tu repositorio en GitHub: `https://github.com/eduarell-cmd/Evidence-4`.
2. Ve a **Settings** -> **Branches** (en el menú lateral izquierdo, sección *Code and automation*).
3. Haz clic en **Add branch protection rule** (o **Add classic branch protection rule**).
4. En **Branch name pattern**, escribe:
   `main`
5. Activa las siguientes opciones:
   - [x] **Require a pull request before merging**
     - [x] **Require approvals** -> selecciona **`1`**
     - [x] **Dismiss stale pull request approvals when new commits are pushed** (recomendado)
   - [x] **Require status checks to pass before merging**
     - [x] **Require branches to be up to date before merging**
     - En el buscador **Status checks that are required**, busca y selecciona **`test-and-build`**.
   - [x] **Do not allow bypassing the above settings** (antes llamado *Include administrators*, recomendado para que incluso el dueño respete las reglas en la demo).
6. Haz clic en **Create** / **Save changes** al final de la página.

## Nota sobre la aprobación mínima (`1` approval) en cuentas individuales

GitHub **no permite aprobar tus propios Pull Requests**. Para poder completar la aprobación real de un PR en la práctica:
- **Opción recomendada:** Agrega a un compañero o a una segunda cuenta de GitHub como colaborador en **Settings -> Collaborators**, para que esa cuenta apruebe el Pull Request (`Files changed -> Review changes -> Approve`).
- Si necesitas demostrar primero el bloqueo por falta de aprobación y por prueba fallida, verás ambos bloqueos reflejados en el panel inferior del Pull Request en GitHub.
