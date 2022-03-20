/* eslint-disable @typescript-eslint/no-explicit-any */

import chalk, { ChalkInstance } from "chalk";
import { getEnv } from "env";

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

export function isLogLevel(level: string): level is LogLevelString {
  return (LOG_LEVELS as readonly string[]).includes(level);
}

export class Logger {
  readonly level: LogLevel;

  constructor(readonly name: string) {
    const level = getEnv().GT_LOG_LEVEL;
    if (!isLogLevel(level)) {
      throw new Error(`Invalid log level "${level}". Valid values: ${LOG_LEVELS.join()}`);
    }
    this.level = LogLevel[level];
  }

  private out(level: LogLevel, message: any, params: any[], colour: ChalkInstance) {
    if (this.level <= level) {
      const msg = this.colourIfString(message, colour);
      process.stdout.write(colour(this.prefix(level)));
      params.length > 0 ? console.log(colour(msg), params) : console.log(colour(msg));
    }
  }

  private err(level: LogLevel, message: any, params: any[], colour: ChalkInstance) {
    if (this.level <= level) {
      const msg = this.colourIfString(message, colour);
      process.stderr.write(colour(this.prefix(level)));
      params.length > 0 ? console.error(msg, params) : console.error(msg);
    }
  }

  private prefix(level: LogLevel): string {
    const date = new Date().toISOString().match(/\d{2}:\d{2}:\d{2}.\d{3}/) as RegExpMatchArray;
    return `${date[0]} | ${LogLevel[level].padEnd(5, " ")} | ${this.name} | `;
  }

  private colourIfString<T>(obj: T, colour: ChalkInstance): T {
    if (typeof obj === "string") {
      return colour(obj) as any;
    }
    return obj;
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
