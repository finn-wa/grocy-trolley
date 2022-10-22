import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { getEnvVar } from "./environment";

export function getCacheDir(): string {
  return getEnvVar("CACHE_DIR");
}

export function sanitiseEmailForCache(email?: string): string {
  if (!email) {
    return "anon";
  }
  return email.replace(/\W+/g, "_");
}

export function getCacheDirForEmail(email?: string) {
  return path.join(getCacheDir(), sanitiseEmailForCache(email));
}

type Store = { [x: string]: unknown };
/**
 * Factory for cache service - necessary because the cache service was getting
 * manually instantiated which made it difficult to test.
 */
export type CacheServiceFactory<T extends Store = Store> = (dir: string) => CacheService<T>;

/**
 * Default factory for constructing CacheServices.
 * @param dir path to use for cache files (relative to $CACHE_DIR)
 * @returns the new CacheService
 */
export function createCacheService<T extends Store = Store>(dir: string) {
  return new CacheService<T>(dir);
}

/**
 * A cache service that acts like a file-backed record with get and set methods.
 * @param T the shape of the store. Object keys will be converted to file names
 *          and values will be stored as JSON.
 */
export class CacheService<T extends Record<string, unknown>> {
  readonly cacheDir: string;

  constructor(
    /** Cache directory relative to the app's cache dir, e.g. "grocer/stores" */
    readonly relativeCacheDir: string
  ) {
    if (relativeCacheDir.includes("..")) {
      throw new Error(`Bad relative path (contains "..")`);
    }
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
