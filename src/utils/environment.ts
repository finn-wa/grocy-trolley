import { Logger, prettyPrint } from "@gt/utils/logger";
import { config } from "dotenv";
import { existsSync } from "fs";

const EnvVars = [
  "BARCODEBUDDY_URL",
  "CACHE_DIR",
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

let _env: Env | null = null;

export function initEnv(options: { envFilePath?: string; overrides?: Partial<Env> } = {}) {
  if (_env !== null) {
    throw new Error("initEnv has already been called");
  }
  if (options.envFilePath) {
    if (!existsSync(options.envFilePath)) {
      throw new Error(`Env file ${options.envFilePath} does not exist`);
    }
    config({ path: options.envFilePath });
  } else {
    config();
  }
  _env = Object.fromEntries(EnvVars.map((key) => [key, process.env[key]])) as Env;
  // Apply overrides
  if (options.overrides) {
    _env = { ..._env, ...options.overrides };
  }
  const undefinedVars = EnvVars.filter((envVar) => _env![envVar] === undefined);
  if (undefinedVars.length > 0) {
    throw new Error(`Undefined environment variables: "${undefinedVars.join()}"`);
  }
  new Logger("env").trace(`Initialised env: \n${prettyPrint(_env)}`);
}

export function getEnv(): Env {
  if (_env === null) {
    initEnv();
  }
  return { ...(_env as Env) };
}

/**
 * A semi-pointless utility method. The same as doing:
 * ```js
 * const env = getEnv();
 * const mappedEnv = {envKey1: env.ENV_KEY1, envKey2: env.ENV_KEY2};
 * ```
 *
 * But you get to save one WHOLE line and do
 * ```js
 * const mappedEnv = getEnvAs({ENV_KEY1: envKey1, ENV_KEY2: envKey2});
 * ```
 *
 * Syntax inspired by
 * ```js
 * const {ENV_KEY1: envKey1, ENV_KEY2: envKey2} = getEnv();
 * const mappedEnv = {envKey1, envKey2};
 * ```
 * @param mappings Map from env variable keys to the object keys you want
 * @returns Map from your object keys to env variable values
 */
export function getEnvAs<EnvKey extends keyof Env, NewKey extends string>(
  mappings: Record<EnvKey, NewKey>
): Record<NewKey, Env[EnvKey]> {
  const env = getEnvKeys(Object.keys(mappings) as EnvKey[]);
  const entries = Object.entries(mappings) as [EnvKey, NewKey][];
  const mappedEntries = entries.map(([envKey, newKey]) => [newKey, env[envKey]] as const);
  return Object.fromEntries(mappedEntries) as Record<NewKey, Env[EnvKey]>;
}

/**
 * Another semi-pointless utility method that was mainly written for *✨fun with types✨*.
 * Filters the env object by the specified keys.
 * @param keys Keys to pick from the env object
 * @returns Filtered env
 */
export function getEnvKeys<K extends EnvVar[]>(keys: K): Pick<Env, K[number]> {
  const entries = Object.entries(getEnv()).filter(([key]) => keys.includes(key as EnvVar));
  if (entries.length !== keys.length) {
    throw new Error("Undefined keys! \n" + prettyPrint(entries));
  }
  return Object.fromEntries(entries) as Pick<Env, K[number]>;
}
