/* eslint-disable @typescript-eslint/no-explicit-any */

export function prettyPrint(obj: any) {
  return JSON.stringify(obj, undefined, 2);
}

export enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR,
}
const LOG_LEVELS = ["DEBUG", "INFO", "WARN", "ERROR"] as const;
// type LogLevelString = typeof LOG_LEVELS[number];

class Logger {
  constructor(public level: LogLevel) {}

  private out(level: LogLevel, message: any, ...params: any[]) {
    if (this.level <= level) {
      console.log(message, params);
    }
  }

  private err(level: LogLevel, message: any, ...params: any[]) {
    if (this.level <= level) {
      console.error(message, params);
    }
  }

  debug(message: any, ...params: any[]) {
    this.out(LogLevel.DEBUG, message, params);
  }

  info(message: any, ...params: any[]) {
    this.out(LogLevel.INFO, message, params);
  }

  warn(message: any, ...params: any[]) {
    this.err(LogLevel.WARN, message, params);
  }

  error(message: any, ...params: any[]) {
    this.err(LogLevel.ERROR, message, params);
  }
}

// const logLevel = env().LOG_LEVEL;
// if (!LOG_LEVELS.includes(logLevel as LogLevelString)) {
//   throw new Error(`Invalid log level "${logLevel}". Valid values: ${LOG_LEVELS.join()}`);
// }
// export const logger = new Logger(LogLevel[logLevel as LogLevelString]);
export const logger = new Logger(LogLevel.INFO);
