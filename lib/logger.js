// Structured logging utility for E.C.H.O
// Provides consistent, structured logging with levels and context

const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

const LOG_LEVEL_PRIORITY = {
  [LOG_LEVELS.DEBUG]: 0,
  [LOG_LEVELS.INFO]: 1,
  [LOG_LEVELS.WARN]: 2,
  [LOG_LEVELS.ERROR]: 3,
};

let currentLogLevel = process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;

const shouldLog = (level) => {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLogLevel];
};

const formatMessage = (context, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: context,
    message,
    ...(data && { data }),
  };
  return logEntry;
};

const log = (context, message, data = null) => {
  if (!shouldLog(context)) return;

  const logEntry = formatMessage(context, message, data);
  
  switch (context) {
    case LOG_LEVELS.DEBUG:
      console.debug('[DEBUG]', logEntry);
      break;
    case LOG_LEVELS.INFO:
      console.info('[INFO]', logEntry);
      break;
    case LOG_LEVELS.WARN:
      console.warn('[WARN]', logEntry);
      break;
    case LOG_LEVELS.ERROR:
      console.error('[ERROR]', logEntry);
      break;
    default:
      console.log(logEntry);
  }
};

// Context-specific loggers
export const logger = {
  debug: (message, data) => log(LOG_LEVELS.DEBUG, message, data),
  info: (message, data) => log(LOG_LEVELS.INFO, message, data),
  warn: (message, data) => log(LOG_LEVELS.WARN, message, data),
  error: (message, data) => log(LOG_LEVELS.ERROR, message, data),
  
  // Context-specific helpers
  ai: (message, data) => log(LOG_LEVELS.INFO, `[AI] ${message}`, data),
  chat: (message, data) => log(LOG_LEVELS.INFO, `[CHAT] ${message}`, data),
  emotion: (message, data) => log(LOG_LEVELS.INFO, `[EMOTION] ${message}`, data),
  task: (message, data) => log(LOG_LEVELS.INFO, `[TASK] ${message}`, data),
  auth: (message, data) => log(LOG_LEVELS.INFO, `[AUTH] ${message}`, data),
  
  setLogLevel: (level) => {
    if (Object.values(LOG_LEVELS).includes(level)) {
      currentLogLevel = level;
    }
  },
};

export default logger;
