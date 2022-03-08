/* eslint-disable @typescript-eslint/no-explicit-any */

import { getEnv } from "@grocy-trolley/env";

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

  private out(level: LogLevel, message: any, params: any[]) {
    if (this.level <= level) {
      process.stdout.write(this.prefix(level));
      params.length > 0 ? console.log(message, params) : console.log(message);
    }
  }

  private err(level: LogLevel, message: any, params: any[]) {
    if (this.level <= level) {
      process.stderr.write(this.prefix(level));
      params.length > 0 ? console.error(message, params) : console.error(message);
    }
  }

  private prefix(level: LogLevel) {
    const date = new Date().toISOString().match(/\d{2}:\d{2}:\d{2}.\d{3}/) as RegExpMatchArray;
    return `${date[0]} | ${LogLevel[level]} | ${this.name} | `;
  }

  trace(message: any, ...params: any[]) {
    this.out(LogLevel.TRACE, message, params);
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
