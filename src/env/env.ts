import { Logger, prettyPrint } from "utils/logger";
import { config } from "dotenv";

const EnvVars = [
  "BARCODEBUDDY_URL",
  "GROCY_API_KEY",
  "GROCY_URL",
  "GT_LOG_LEVEL",
  "OCR_API_KEY",
  "PAKNSAVE_EMAIL",
  "PAKNSAVE_PASSWORD",
  "TAGGUN_API_KEY",
] as const;
type EnvVar = typeof EnvVars[number];

export type Env = Record<EnvVar, string>;

let env: Env | null = null;

export function initEnv(options: { envFilePath?: string; overrides?: Partial<Env> } = {}) {
  if (env !== null) {
    throw new Error("initEnv has already been called");
  }
  // Load from .env file
  options.envFilePath ? config({ path: options.envFilePath }) : config();
  env = Object.fromEntries(EnvVars.map((key) => [key, process.env[key]])) as Env;
  // Apply overrides
  if (options.overrides) {
    Object.assign(env, options.overrides);
  }
  const undefinedVars = EnvVars.filter((envVar) => env![envVar] === undefined);
  if (undefinedVars.length > 0) {
    throw new Error(`Undefined environment variables: "${undefinedVars.join()}"`);
  }
  new Logger("env").trace(`Initialised env: \n${prettyPrint(env)}`);
}

export function getEnv(): Env {
  if (env === null) {
    initEnv();
  }
  return { ...(env as Env) };
}
