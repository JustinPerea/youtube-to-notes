type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const levelOrder: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

function getCurrentLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL || 'info').toLowerCase();
  if (raw === 'error' || raw === 'warn' || raw === 'info' || raw === 'debug') return raw;
  return 'info';
}

function shouldLog(desired: LogLevel): boolean {
  const current = getCurrentLevel();
  return levelOrder[desired] <= levelOrder[current];
}

function redact(value: any): any {
  const sensitiveKeys = ['password', 'token', 'secret', 'api_key', 'apikey', 'authorization', 'set-cookie', 'cookie', 'key', 'email'];

  const redactString = (s: string) => {
    if (!s) return s;
    if (s.length <= 8) return '[REDACTED]';
    return `${s.slice(0, 4)}***${s.slice(-4)}`;
  };

  const helper = (input: any): any => {
    if (input == null) return input;
    if (typeof input === 'string') return input;
    if (typeof input !== 'object') return input;
    if (Array.isArray(input)) return input.map(helper);
    const out: any = {};
    for (const [k, v] of Object.entries(input)) {
      if (sensitiveKeys.some(sk => k.toLowerCase().includes(sk))) {
        if (typeof v === 'string') out[k] = redactString(v);
        else out[k] = '[REDACTED]';
      } else {
        out[k] = helper(v);
      }
    }
    return out;
  };

  return helper(value);
}

function fmt(message: any, meta?: any) {
  if (meta === undefined) return message;
  try {
    return `${message} ${JSON.stringify(redact(meta))}`;
  } catch {
    return message;
  }
}

export const logger = {
  error(message: any, meta?: any) {
    if (shouldLog('error')) console.error(fmt(message, meta));
  },
  warn(message: any, meta?: any) {
    if (shouldLog('warn')) console.warn(fmt(message, meta));
  },
  info(message: any, meta?: any) {
    if (shouldLog('info')) console.log(fmt(message, meta));
  },
  debug(message: any, meta?: any) {
    if (shouldLog('debug')) console.log(fmt(message, meta));
  },
};

