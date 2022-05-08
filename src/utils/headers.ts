import { Logger, prettyPrint } from "./logger";

export const APPLICATION_JSON = "application/json";

/**
 * Non-spec util method from node-fetch library.
 * @returns Record mapping each header key to all of its values as an array.
 * @see {@link headersFromRaw}
 */
export function headersToRaw(headers: Headers): Record<string, string[]> {
  const entries: Record<string, string[]> = {};
  headers.forEach((value, key) =>
    key in entries ? entries[key].push(value) : (entries[key] = [value])
  );
  return entries;
}

/**
 * Converts node-fetch raw headers format to native fetch Headers.
 * Inverse of {@link headersToRaw}.
 * @param rawHeaders
 * @returns Headers object
 */
export function headersFromRaw(rawHeaders: Record<string, string[]>): Headers {
  const headers = new Headers();
  Object.entries(rawHeaders).forEach(([name, values]) =>
    values.forEach((value) => headers.append(name, value))
  );
  return headers;
}

export class HeadersBuilder {
  readonly headers: Headers;
  private readonly logger = new Logger(this.constructor.name);

  constructor(init?: HeadersInit) {
    this.headers = new Headers(init);
  }

  apikey(key: string): HeadersBuilder {
    this.headers.append("apikey", key);
    return this;
  }

  contentType(mimeType: string): HeadersBuilder {
    this.headers.append("Content-Type", mimeType);
    return this;
  }

  contentTypeJson(): HeadersBuilder {
    return this.contentType(APPLICATION_JSON);
  }

  accept(mimeType: string): HeadersBuilder {
    this.headers.append("Accept", mimeType);
    return this;
  }

  acceptJson(): HeadersBuilder {
    return this.accept(APPLICATION_JSON);
  }

  cookie(cookie: string) {
    this.headers.append("Cookie", cookie);
    return this;
  }

  append(name: string, value: string) {
    this.headers.append(name, value);
    return this;
  }

  build(): Headers {
    return this.headers;
  }

  raw(): Record<string, string[]> {
    return headersToRaw(this.headers);
  }

  toString(): string {
    return prettyPrint(this.raw());
  }
}

/**
 * Gotta save those characters on constructors
 * @returns new HeadersBuilder()
 */
export function headersBuilder(raw?: Record<string, string[]>): HeadersBuilder {
  if (!raw) {
    return new HeadersBuilder();
  }
  return new HeadersBuilder(headersFromRaw(raw));
}
