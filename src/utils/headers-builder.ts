import { Headers, HeadersInit } from "node-fetch";

export const APPLICATION_JSON = "application/json";

export class HeadersBuilder {
  private readonly headers: Headers;

  constructor(init?: HeadersInit) {
    this.headers = new Headers(init);
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
}

/**
 * Gotta save those characters on constructors
 * @returns new HeadersBuilder()
 */
export function headers(): HeadersBuilder {
  return new HeadersBuilder();
}
