import dotenv from 'dotenv';

dotenv.config();

/**
 * Reads and normalizes environment configuration for the server.
 * @param {NodeJS.ProcessEnv} sourceEnv
 * @returns {{ port: number, nodeEnv: string, appName: string, corsOrigin: string }}
 */
export function getEnvConfig(sourceEnv = process.env) {
  const parsedPort = Number.parseInt(sourceEnv.PORT ?? '3000', 10);
  const port = Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort <= 65535 ? parsedPort : 3000;

  return {
    port,
    nodeEnv: sourceEnv.NODE_ENV?.trim() || 'development',
    appName: sourceEnv.APP_NAME?.trim() || 'TaskFlow',
    corsOrigin: sourceEnv.CORS_ORIGIN?.trim() || ''
  };
}

export const env = getEnvConfig();
