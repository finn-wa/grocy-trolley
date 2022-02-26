import "dotenv/config";

const EnvVars = [
  "GROCY_API_KEY",
  "GROCY_URL",
  "PAKNSAVE_EMAIL",
  "PAKNSAVE_PASSWORD",
  "SPLITWISE_PASSWORD",
  "SPLITWISE_USER",
  "TAGGUN_API_KEY",
  "GT_LOG_LEVEL",
] as const;
type EnvVar = typeof EnvVars[number];

export type Env = Record<EnvVar, string>;

let envValidated = false;
const env = Object.fromEntries(EnvVars.map(key => [key, process.env[key]])) as Env;

export function initEnv(overrides: Partial<Env>) {
  if(envValidated) {
    throw new Error("initEnv has already been called");
  }
  Object.assign(overrides, env);
  const undefinedVars = EnvVars.filter((envVar) => env[envVar] === undefined);
  if (undefinedVars.length > 0) {
    throw new Error(`Undefined environment variables: "${undefinedVars.join()}"`);
  }
  envValidated = true;
  return getEnv();
}


export function getEnv(): Env {
  if(!envValidated) {
    initEnv({});
  }
  return { ...env };
}
