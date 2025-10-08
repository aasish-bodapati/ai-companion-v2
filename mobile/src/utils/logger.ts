/**
 * Simple logging utility to control log verbosity
 */

const isDevelopment = __DEV__;
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

class Logger {
  private level: LogLevel = isDevelopment ? 'INFO' : 'ERROR';

  setLevel(level: LogLevel) {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] <= LOG_LEVELS[this.level];
  }

  error(message: string, ...args: unknown[]) {
    if (this.shouldLog('ERROR')) {
      console.error(`❌ ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]) {
    if (this.shouldLog('WARN')) {
      console.warn(`⚠️ ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]) {
    if (this.shouldLog('INFO')) {
      console.log(`ℹ️ ${message}`, ...args);
    }
  }

  debug(message: string, ...args: unknown[]) {
    if (this.shouldLog('DEBUG')) {
      console.log(`🔍 ${message}`, ...args);
    }
  }

  // Special loggers for specific features
  api(message: string, ...args: unknown[]) {
    if (this.shouldLog('DEBUG')) {
      console.log(`🌐 [API] ${message}`, ...args);
    }
  }

  steps(message: string, ...args: unknown[]) {
    if (this.shouldLog('DEBUG')) {
      console.log(`🚶 ${message}`, ...args);
    }
  }

  nutrition(message: string, ...args: unknown[]) {
    if (this.shouldLog('DEBUG')) {
      console.log(`🍽️ ${message}`, ...args);
    }
  }

  fitness(message: string, ...args: unknown[]) {
    if (this.shouldLog('DEBUG')) {
      console.log(`💪 ${message}`, ...args);
    }
  }

  auth(message: string, ...args: unknown[]) {
    if (this.shouldLog('DEBUG')) {
      console.log(`🔐 ${message}`, ...args);
    }
  }

  navigation(message: string, ...args: unknown[]) {
    if (this.shouldLog('DEBUG')) {
      console.log(`🧭 ${message}`, ...args);
    }
  }
}

export const logger = new Logger();

// Set production log level
if (!isDevelopment) {
  logger.setLevel('ERROR');
}

export default logger;
