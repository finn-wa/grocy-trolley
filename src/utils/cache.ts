import path from "path";
import { getEnv } from "./environment";

export function getCacheDir(): string {
  return getEnv().CACHE_DIR;
}

export function getCacheDirForEmail(email: string) {
  return path.join(getCacheDir(), email.replace(/\W+/g, "_"));
}
