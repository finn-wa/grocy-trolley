import fetch, { Body, BodyInit, Headers, Response } from "node-fetch";
import { URL, URLSearchParams } from "url";
import { APPLICATION_JSON } from "./headers-builder";
import { Logger, prettyPrint } from "./logger";

export abstract class RestService {
  protected abstract readonly baseUrl: `${string}/`;
  protected abstract readonly logger: Logger;

  protected validateBaseUrl(baseUrl: string): `${string}/` {
    if (!baseUrl.endsWith("/")) {
      throw new Error(`Base URL must end with a slash, found: ${this.baseUrl}`);
    }
    return baseUrl as `${string}/`;
  }

  protected buildUrl(path: string, params?: Record<string, string>): string {
    if (!params) {
      return this.baseUrl + path;
    }
    const url = new URL(path, this.baseUrl);
    url.search = new URLSearchParams(params).toString();
    return url.toString();
  }

  private async extract<T>(response: Response, extractor: (b: Response) => Promise<T>) {
    if (!response.ok) {
      throw new Error(`[${response.status}] ${prettyPrint(await extractor(response))}`);
    }
    const body = await extractor(response);
    this.logger.trace(prettyPrint(body));
    return body;
  }

  protected async extractJson<T>(response: Response): Promise<T> {
    return this.extract<T>(response, (r) => r.json() as Promise<T>);
  }

  protected async extractText(response: Response): Promise<string> {
    return this.extract(response, (r) => r.text());
  }

  private async fetchWithMethod(
    method: string,
    url: string,
    headers?: Headers,
    body?: BodyInit | any
  ): Promise<Response> {
    this.logger.debug(`${method} ${url}`);
    if (headers) {
      this.logger.trace(
        Array.from(headers.entries())
          .map(([k, v]) => `${k}=${v}`)
          .join("\n")
      );
    }
    if (body) {
      this.logger.trace(body);
    }
    const contentType = headers?.get("content-type");
    if (contentType === APPLICATION_JSON && body) {
      body = JSON.stringify(body);
    }
    const response = await fetch(url, { method, headers, body });
    this.logger.trace(`Response: ${response.status}`);
    if (!response.ok) {
      throw new Error(`Response not OK: ${await response.text()}`);
    }
    return response;
  }

  private async fetchJsonWithMethod<T>(
    method: string,
    url: string,
    headers?: Headers,
    body?: BodyInit | unknown
  ): Promise<T> {
    const response = await this.fetchWithMethod(method, url, headers, body);
    return this.extractJson(response) as Promise<T>;
  }

  protected async get(
    url: string,
    headers?: Headers,
    body?: BodyInit | unknown
  ): Promise<Response> {
    return this.fetchWithMethod("GET", url, headers, body);
  }

  protected async getForJson<T>(
    url: string,
    headers?: Headers,
    body?: BodyInit | unknown
  ): Promise<T> {
    return this.fetchJsonWithMethod("GET", url, headers, body);
  }

  protected async post(
    url: string,
    headers?: Headers,
    body?: BodyInit | unknown
  ): Promise<Response> {
    return this.fetchWithMethod("POST", url, headers, body);
  }

  protected async postForJson<T>(
    url: string,
    headers?: Headers,
    body?: BodyInit | unknown
  ): Promise<T> {
    return this.fetchJsonWithMethod("POST", url, headers, body);
  }

  protected async put(
    url: string,
    headers?: Headers,
    body?: BodyInit | unknown
  ): Promise<Response> {
    return this.fetchWithMethod("PUT", url, headers, body);
  }

  protected async putForJson<T>(
    url: string,
    headers?: Headers,
    body?: BodyInit | unknown
  ): Promise<T> {
    return this.fetchJsonWithMethod("PUT", url, headers, body);
  }

  protected async delete(url: string, headers?: Headers): Promise<Response> {
    return this.fetchWithMethod("DELETE", url, headers);
  }

  protected async deleteForJson<T>(url: string, headers?: Headers): Promise<T> {
    return this.fetchJsonWithMethod("DELETE", url, headers);
  }
}
