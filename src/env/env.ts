import "dotenv/config";

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

let envValidated = false;
const env = Object.fromEntries(EnvVars.map((key) => [key, process.env[key]])) as Env;

export function initEnv(overrides: Partial<Env>) {
  if (envValidated) {
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
  if (!envValidated) {
    initEnv({});
  }
  return { ...env };
}
