/**
 * Structured Logging & Telemetry Abstraction
 * Formats logs with ISO timestamps, correlation IDs, and execution latency.
 */

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  module: string;
  message: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
  latencyMs?: number;
}

export class Logger {
  private module: string;

  constructor(module: string) {
    this.module = module;
  }

  private log(level: LogEntry['level'], message: string, metadata?: Record<string, unknown>, latencyMs?: number) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module: this.module,
      message,
      metadata,
      latencyMs
    };
    
    // In production, logs serialize to structured JSON for Datadog / Google Cloud Logging ingestion
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(entry));
    } else {
      const colorMap = {
        INFO: '\x1b[32m',
        WARN: '\x1b[33m',
        ERROR: '\x1b[31m',
        DEBUG: '\x1b[36m'
      };
      const reset = '\x1b[0m';
      const metaStr = metadata ? ` ${JSON.stringify(metadata)}` : '';
      const latStr = latencyMs !== undefined ? ` [${latencyMs}ms]` : '';
      console.log(`${colorMap[level]}[${entry.level}]${reset} [${this.module}] ${message}${latStr}${metaStr}`);
    }
  }

  info(message: string, metadata?: Record<string, unknown>, latencyMs?: number) {
    this.log('INFO', message, metadata, latencyMs);
  }

  warn(message: string, metadata?: Record<string, unknown>) {
    this.log('WARN', message, metadata);
  }

  error(message: string, error?: unknown, metadata?: Record<string, unknown>) {
    const errObj = error instanceof Error 
      ? { name: error.name, message: error.message, stack: error.stack }
      : { raw: error };
    this.log('ERROR', message, { ...metadata, error: errObj });
  }

  debug(message: string, metadata?: Record<string, unknown>) {
    this.log('DEBUG', message, metadata);
  }
}
