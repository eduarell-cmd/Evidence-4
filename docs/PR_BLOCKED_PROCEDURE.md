# Procedimiento: Pull Request Bloqueado, Corrección y Fusión

Este procedimiento permite generar **evidencia real** de cómo GitHub Actions y la protección de `main` bloquean un Pull Request cuando falla una prueba unitaria, y cómo se desbloquea tras corregir el error.

> **Requisito previo:** Haber subido el proyecto inicial a `main`, ejecutado al menos una vez el workflow `test-and-build`, y activado la protección de `main` descrita en [BRANCH_PROTECTION.md](./BRANCH_PROTECTION.md).

---

## Paso 1: Crear una rama de trabajo desde `main`

```bash
git checkout main
git pull origin main
git checkout -b fix/demo-blocked-pr
```

## Paso 2: Introducir un error intencional reproducible

Edita temporalmente `src/services/taskService.js` (por ejemplo, en `validateTaskInput`, cambia temporalmente el límite mínimo o la condición de `title` para provocar un fallo real en las pruebas):

```js
// Cambio temporal para demostrar fallo en prueba unitaria:
if (trimmedTitle.length < TITLE_MIN_LENGTH + 5 || trimmedTitle.length > TITLE_MAX_LENGTH) {
```

Verifica localmente que las pruebas realmente fallan:

```bash
npm test
```

Deberías observar fallos en las pruebas que envían títulos válidos cortos (como `'  API  '`, `'Prueba CI'`, etc.).

## Paso 3: Subir la rama y abrir un Pull Request hacia `main`

```bash
git add src/services/taskService.js
git commit -m "test-demo: introduce validation regression to demonstrate blocked PR"
git push -u origin fix/demo-blocked-pr
```

1. En GitHub, abre un **Pull Request** de `fix/demo-blocked-pr` hacia `main`.
2. Espera unos segundos a que se ejecute el workflow `CI - Tests and Build`.
3. **Evidencia 1 (PR bloqueado):** Toma captura de pantalla donde se vea:
   - El check `test-and-build` en rojo (**Failed**).
   - El botón **Merge pull request** deshabilitado/bloqueado por la regla de protección de rama.
   - El detalle del log en la pestaña **Checks** / **Actions** mostrando el error exacto de Vitest.

## Paso 4: Corregir el error en la misma rama

Restaura la línea original en `src/services/taskService.js`:

```js
if (trimmedTitle.length < TITLE_MIN_LENGTH || trimmedTitle.length > TITLE_MAX_LENGTH) {
```

Verifica localmente que todas las pruebas y el build vuelven a pasar:

```bash
npm test
npm run build
```

Haz commit y sube la corrección a la misma rama:

```bash
git add src/services/taskService.js
git commit -m "fix: restore minimum title length validation"
git push
```

## Paso 5: Verificar desbloqueo, aprobar y fusionar

1. En el mismo Pull Request de GitHub, verifica que `test-and-build` vuelva a ejecutarse y pase en verde (**All checks have passed**).
2. Solicita la aprobación de tu colaborador / segunda cuenta (**1 approving review**).
3. **Evidencia 2 (PR aprobado y en verde):** Toma captura del PR con el check en verde y la aprobación registrada.
4. Haz clic en **Merge pull request** (y opcionalmente elimina la rama `fix/demo-blocked-pr`).
5. Actualiza tu copia local de `main` y registra los hashes reales y enlaces en [DEVELOPMENT_LOG.md](./DEVELOPMENT_LOG.md):
   ```bash
   git checkout main
   git pull origin main
   ```
