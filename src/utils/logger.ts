/* eslint-disable @typescript-eslint/no-explicit-any */
import chalk from "chalk";
import { getEnv } from "@gt/utils/environment";
import { Logger as PlaywrightLogger } from "playwright";
// Unfortunately ESM Chalk 5 doesn't work with ts-jest
// If it ever does, change this to an import when upgrading
type ChalkInstance = chalk.ChalkFunction;

export function prettyPrint(obj: any) {
  return JSON.stringify(obj, undefined, 2);
}

export enum LogLevel {
  TRACE,
  DEBUG,
  INFO,
  WARN,
  ERROR,
}
export const LOG_LEVELS = ["TRACE", "DEBUG", "INFO", "WARN", "ERROR"] as const;
export type LogLevelString = typeof LOG_LEVELS[number];

export class Logger {
  readonly level: LogLevel;

  constructor(readonly name: string, logLevel?: LogLevel) {
    if (logLevel) {
      this.level = logLevel;
    } else {
      const level = getEnv().GT_LOG_LEVEL;
      if (!isLogLevel(level)) {
        throw new Error(`Invalid log level "${level}". Valid values: ${LOG_LEVELS.join()}`);
      }
      this.level = LogLevel[level];
    }
  }

  private out(level: LogLevel, message: any, params: any[], colour: ChalkInstance) {
    if (this.level <= level) {
      const msg = this.colourIfString(message, colour) as unknown;
      process.stdout.write(colour(this.prefix(level)));
      params.length > 0 ? console.log(colour(msg), params) : console.log(colour(msg));
    }
  }

  private err(level: LogLevel, message: any, params: any[], colour: ChalkInstance) {
    if (this.level <= level) {
      const msg = this.colourIfString(message, colour) as unknown;
      process.stderr.write(colour(this.prefix(level)));
      params.length > 0 ? console.error(msg, params) : console.error(msg);
    }
  }

  private prefix(level: LogLevel): string {
    const date = new Date().toISOString().match(/\d{2}:\d{2}:\d{2}.\d{3}/) as RegExpMatchArray;
    return `${date[0]} | ${LogLevel[level].padEnd(5, " ")} | ${this.name} | `;
  }

  private colourIfString<T>(obj: T, colour: ChalkInstance): T extends string ? string : T {
    if (typeof obj === "string") {
      return colour(obj) as T extends string ? string : T;
    }
    return obj as T extends string ? string : T;
  }

  log(level: LogLevel, message: any, params: unknown[]) {
    switch (level) {
      case LogLevel.TRACE:
        return this.trace(message, ...params);
      case LogLevel.DEBUG:
        return this.debug(message, ...params);
      case LogLevel.INFO:
        return this.info(message, ...params);
      case LogLevel.WARN:
        return this.warn(message, ...params);
      case LogLevel.ERROR:
        return this.error(message, ...params);
    }
  }

  trace(message: any, ...params: any[]) {
    this.out(LogLevel.TRACE, message, params, chalk.gray);
  }

  debug(message: any, ...params: any[]) {
    this.out(LogLevel.DEBUG, message, params, chalk.blue);
  }

  info(message: any, ...params: any[]) {
    this.out(LogLevel.INFO, message, params, chalk.green);
  }

  warn(message: any, ...params: any[]) {
    this.err(LogLevel.WARN, message, params, chalk.yellow);
  }

  error(message: any, ...params: any[]) {
    this.err(LogLevel.ERROR, message, params, chalk.red);
  }
}

export function isLogLevel(level: string): level is LogLevelString {
  return (LOG_LEVELS as readonly string[]).includes(level);
}

export function playwrightLogger(levelOverride?: LogLevel): PlaywrightLogger {
  const logger = new Logger("Playwright", levelOverride);
  type PlaywrightSeverity = Parameters<PlaywrightLogger["isEnabled"]>[1];
  const logLevel: Record<PlaywrightSeverity, LogLevel> = {
    verbose: LogLevel.DEBUG,
    info: LogLevel.INFO,
    warning: LogLevel.WARN,
    error: LogLevel.ERROR,
  };
  return {
    isEnabled: (_name, _severity) => true,
    log: (name, severity, message, args, _options) =>
      logger.log(logLevel[severity], `${name}: ${message?.toString()}`, args),
  };
}
