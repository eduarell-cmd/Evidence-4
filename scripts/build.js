import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const jsFilesToCheck = [
  'src/config/env.js',
  'src/services/taskService.js',
  'src/routes/taskRoutes.js',
  'src/app.js',
  'src/server.js',
  'public/app.js'
];

for (const relativePath of jsFilesToCheck) {
  const absolutePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`[build] Falta archivo requerido: ${relativePath}`);
    process.exit(1);
  }
  execFileSync(process.execPath, ['--check', absolutePath], { stdio: 'inherit' });
}

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

fs.cpSync(path.join(rootDir, 'src'), path.join(distDir, 'src'), { recursive: true });
fs.cpSync(path.join(rootDir, 'public'), path.join(distDir, 'public'), { recursive: true });
fs.copyFileSync(path.join(rootDir, 'package.json'), path.join(distDir, 'package.json'));

const buildInfo = {
  name: 'taskflow-web-app',
  builtAt: new Date().toISOString(),
  nodeVersion: process.version
};

fs.writeFileSync(
  path.join(distDir, 'build-info.json'),
  `${JSON.stringify(buildInfo, null, 2)}\n`,
  'utf8'
);

console.log(`[build] Verificación de sintaxis exitosa y artefactos generados en ${distDir}`);
