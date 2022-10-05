/* eslint-disable @typescript-eslint/no-explicit-any */
import chalk, { ChalkInstance } from "chalk";
import stringify from "json-stringify-pretty-compact";
import { getEnvVar } from "@gt/utils/environment";
import { Logger as PlaywrightLogger } from "playwright";
import { Logger as SlackLogger, LogLevel as SlackLogLevel } from "@slack/bolt";

export function prettyPrint(obj: any) {
  return stringify(obj);
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
      const level = getEnvVar("GT_LOG_LEVEL");
      if (!isLogLevel(level)) {
        throw new Error(`Invalid log level "${level}". Valid values: ${LOG_LEVELS.join()}`);
      }
      this.level = LogLevel[level];
    }
    this.trace("Initialised logger");
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

class SlackLoggerAdapter implements SlackLogger {
  private logger: Logger;

  constructor(logLevel?: LogLevel) {
    this.logger = new Logger("@slack/bolt", logLevel);
  }

  /* eslint-disable @typescript-eslint/no-unsafe-argument */
  debug(...msg: any[]): void {
    this.log(LogLevel.TRACE, msg);
  }
  info(...msg: any[]): void {
    this.log(LogLevel.INFO, msg);
  }
  warn(...msg: any[]): void {
    this.log(LogLevel.WARN, msg);
  }
  error(...msg: any[]): void {
    this.log(LogLevel.ERROR, msg);
  }
  /* eslint-enable @typescript-eslint/no-unsafe-argument */

  private log(level: LogLevel, contents: any[]): void {
    if (contents.length > 1) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const [message, ...params] = contents;
      this.logger.log(level, message, params);
    }
    this.logger.log(level, contents, []);
  }

  setName(name: string): void {
    this.logger = new Logger(name, this.logger.level);
  }

  setLevel(level: SlackLogLevel): void {
    this.logger = new Logger(this.logger.name, this.fromSlackLogLevel(level));
  }

  getLevel(): SlackLogLevel {
    return this.toSlackLogLevel(this.logger.level);
  }

  private fromSlackLogLevel(level: SlackLogLevel): LogLevel {
    switch (level) {
      case SlackLogLevel.DEBUG:
        return LogLevel.TRACE;
      case SlackLogLevel.INFO:
        return LogLevel.INFO;
      case SlackLogLevel.WARN:
        return LogLevel.WARN;
      case SlackLogLevel.ERROR:
        return LogLevel.ERROR;
      default:
        throw new Error("Invalid Slack log level");
    }
  }

  private toSlackLogLevel(level: LogLevel): SlackLogLevel {
    switch (level) {
      case LogLevel.TRACE:
        return SlackLogLevel.DEBUG;
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        return SlackLogLevel.INFO;
      case LogLevel.WARN:
        return SlackLogLevel.WARN;
      case LogLevel.ERROR:
        return SlackLogLevel.ERROR;
      default:
        throw new Error("Invalid GT log level");
    }
  }
}

export function slackLogger(levelOverride?: LogLevel): SlackLogger {
  return new SlackLoggerAdapter(levelOverride);
}
