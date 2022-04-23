export const APPLICATION_JSON = "application/json";

/**
 * Non-spec util method from node-fetch library.
 * @returns Record mapping each header key to all of its values as an array.
 */
export function raw(headers: Headers): Record<string, string[]> {
  const entries: Record<string, string[]> = {};
  headers.forEach(([value, key]) =>
    key in entries ? entries[key].push(value) : (entries[key] = [value])
  );
  return entries;
}

export class HeadersBuilder {
  private readonly headers: Headers;

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
    return raw(this.headers);
  }
}

/**
 * Gotta save those characters on constructors
 * @returns new HeadersBuilder()
 */
export function headersBuilder(): HeadersBuilder {
  return new HeadersBuilder();
}
