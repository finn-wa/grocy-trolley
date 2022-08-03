import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { getEnvVar } from "./environment";

export function getCacheDir(): string {
  return getEnvVar("CACHE_DIR");
}

export function getCacheDirForEmail(email = "anon") {
  return path.join(getCacheDir(), email.replace(/\W+/g, "_"));
}

/**
 * A cache service that acts like a file-backed record with get and set methods.
 * @param T the shape of the store. Object keys will be converted to file names
 *          and values will be stored as JSON.
 */
export class CacheService<T extends Record<string, unknown>> {
  private readonly cacheDir: string;

  constructor(
    /** Cache directory relative to the app's cache dir, e.g. "grocer/stores" */
    readonly relativeCacheDir: string
  ) {
    this.cacheDir = path.join(getCacheDir(), relativeCacheDir);
  }

  async get(key: keyof T): Promise<T[typeof key] | null> {
    const str = await this.read(key as string);
    if (str) {
      return JSON.parse(str) as T[typeof key];
    }
    return null;
  }

  async set(key: keyof T, value: T[keyof T]) {
    return this.write(key as string, JSON.stringify(value));
  }

  private async write(key: string, value: string): Promise<void> {
    const filepath = path.join(this.cacheDir, `${key}.json`);
    if (!existsSync(this.cacheDir)) {
      await mkdir(this.cacheDir, { recursive: true });
    }
    await writeFile(filepath, value);
  }

  private async read(key: string): Promise<string | null> {
    const filepath = path.join(this.cacheDir, `${key}.json`);
    if (existsSync(filepath)) {
      return readFile(filepath, "utf8");
    }
    return null;
  }
}
