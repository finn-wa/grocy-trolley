import { readFileSync } from "fs";

export interface Env {
  readonly GROCY_API_KEY: string;
  readonly GROCY_URL: string;
  readonly PAKNSAVE_EMAIL: string;
  readonly PAKNSAVE_PASSWORD: string;
  readonly SPLITWISE_PASSWORD: string;
  readonly SPLITWISE_USER: string;
  readonly TAGGUN_API_KEY: string;
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
