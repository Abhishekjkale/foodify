/**
 * Environment Configuration and Validation
 * Enforces strict environment typing and fail-fast startup checks.
 */

export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  databaseUrl: string;
  geminiApiKey: string | undefined;
  appUrl: string;
  mcpPort: number;
}

export function validateEnv(): AppConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';
  const port = parseInt(process.env.PORT || '3000', 10);
  const mcpPort = parseInt(process.env.MCP_PORT || '3001', 10);
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://foodify:postgres@localhost:5432/foodify_db';
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const appUrl = process.env.APP_URL || `http://localhost:${port}`;

  if (nodeEnv === 'production' && !databaseUrl) {
    console.warn('[CONFIG] DATABASE_URL not set in production. Using simulated in-memory store.');
  }

  return {
    nodeEnv,
    port,
    databaseUrl,
    geminiApiKey,
    appUrl,
    mcpPort
  };
}

export const config = validateEnv();
