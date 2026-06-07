type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const isProd = process.env.NODE_ENV === 'production';

function format(level: LogLevel, msg: string, meta?: any) {
  const payload: any = { level, message: msg, timestamp: new Date().toISOString() };
  if (meta) payload.meta = meta;
  return JSON.stringify(payload);
}

export const logger = {
  info: (msg: string, meta?: any) => console.log(format('info', msg, meta)),
  warn: (msg: string, meta?: any) => console.warn(format('warn', msg, meta)),
  error: (msg: string, meta?: any) => console.error(format('error', msg, meta)),
  debug: (msg: string, meta?: any) => {
    if (!isProd) console.debug(format('debug', msg, meta));
  },
};

export default logger;
