import "dotenv/config";

const EnvVars = [
  "GROCY_API_KEY",
  "GROCY_URL",
  "PAKNSAVE_EMAIL",
  "PAKNSAVE_PASSWORD",
  "SPLITWISE_PASSWORD",
  "SPLITWISE_USER",
  "TAGGUN_API_KEY",
  "LOG_LEVEL",
] as const;
type EnvVar = typeof EnvVars[number];

export type Env = Record<EnvVar, string>;

const _env = process.env as Env;

export function env(): Env {
  return { ..._env };
}

export function initEnv(overrides: Partial<Env>) {
  Object.assign(overrides, _env);
  const undefinedVars = EnvVars.filter((envVar) => _env[envVar] === undefined);
  if (undefinedVars.length > 0) {
    throw new Error(`Undefined environment variables: "${undefinedVars.join()}"`);
  }
  return env();
}
