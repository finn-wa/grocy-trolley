import { readFileSync } from "fs";

export interface Env {
  readonly splitwiseUser: string;
  readonly splitwisePassword: string;
  readonly taggunApiKey: string;
}

export class EnvParser {
  private readonly _env: Env;
  constructor(readonly path: string) {
    this._env = JSON.parse(readFileSync(path, { encoding: "utf-8" }));
  }
  get env(): Env {
    return { ...this._env };
  }
}
