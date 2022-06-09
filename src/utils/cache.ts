import path from "path";
import { getEnvVar } from "./environment";

export function getCacheDir(): string {
  return getEnvVar("CACHE_DIR");
}

export function getCacheDirForEmail(email = "anon") {
  return path.join(getCacheDir(), email.replace(/\W+/g, "_"));
}
