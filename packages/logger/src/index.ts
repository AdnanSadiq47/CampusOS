export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_KEYS = new Set([
  'password',
  'password_hash',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'jwt_secret',
  'credit_card',
  'authorization',
  'cookie',
]);

export function maskSensitiveData(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => maskSensitiveData(item));
  }

  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase().replace(/[^a-z]/g, '');
    if (SENSITIVE_KEYS.has(lowerKey)) {
      masked[key] = '***[REDACTED]***';
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

export class StructuredLogger {
  constructor(private readonly context?: string) {}

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    const timestamp = new Date().toISOString();
    const sanitizedMeta = meta ? maskSensitiveData(meta) : undefined;

    const payload = {
      timestamp,
      level: level.toUpperCase(),
      context: this.context || 'System',
      message,
      ...(sanitizedMeta && typeof sanitizedMeta === 'object' ? sanitizedMeta : {}),
    };

    const output = JSON.stringify(payload);

    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      default:
        console.log(output);
        break;
    }
  }

  debug(message: string, meta?: Record<string, unknown>) {
    if (process.env['LOG_LEVEL'] === 'debug') {
      this.log('debug', message, meta);
    }
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>) {
    this.log('error', message, meta);
  }
}

export const defaultLogger = new StructuredLogger('CampusOS');
