import fetch, { Headers, Response } from "node-fetch";
import { URL, URLSearchParams } from "url";
import { Logger, prettyPrint } from "./logger";

export abstract class RestService {
  abstract readonly baseUrl: string;
  protected abstract readonly logger: Logger;

  protected buildUrl(path: string, params?: Record<string, string>): string {
    if (!this.baseUrl.endsWith("/")) {
      throw new Error(`Base URL must end with a slash, found '${this.baseUrl}'`);
    }
    if (!params) {
      return this.baseUrl + path;
    }
    const url = new URL(path, this.baseUrl);
    url.search = new URLSearchParams(params).toString();
    return url.toString();
  }

  protected async extractJson(response: Response): Promise<unknown> {
    if (!response.ok) {
      throw new Error(await response.text());
    }
    const body: unknown = await response.json();
    this.logger.debug(prettyPrint(body));
    return body;
  }

  protected async get(url: string, headers?: Headers, body?: unknown): Promise<Response> {
    return this.fetchWithMethod("GET", url, headers, body);
  }

  protected async getForJson<T>(url: string, headers?: Headers, body?: unknown): Promise<T> {
    return this.fetchJsonWithMethod("GET", url, headers, body);
  }

  protected async post(url: string, headers?: Headers, body?: unknown): Promise<Response> {
    return this.fetchWithMethod("POST", url, headers, body);
  }

  protected async postForJson<T>(url: string, headers?: Headers, body?: unknown): Promise<T> {
    return this.fetchJsonWithMethod("POST", url, headers, body);
  }

  protected async put(url: string, headers?: Headers, body?: unknown): Promise<Response> {
    return this.fetchWithMethod("PUT", url, headers, body);
  }

  protected async putForJson<T>(url: string, headers?: Headers, body?: unknown): Promise<T> {
    return this.fetchJsonWithMethod("PUT", url, headers, body);
  }

  protected async delete(url: string, headers?: Headers): Promise<Response> {
    return this.fetchWithMethod("DELETE", url, headers);
  }

  protected async deleteForJson<T>(url: string, headers?: Headers): Promise<T> {
    return this.fetchJsonWithMethod("DELETE", url, headers);
  }

  private async fetchWithMethod(
    method: string,
    url: string,
    headers?: Headers,
    body?: unknown
  ): Promise<Response> {
    this.logger.info(`${method} ${url}`);
    if (headers) {
      this.logger.debug(
        Array.from(headers.entries())
          .map(([k, v]) => `${k}=${v}`)
          .join("\n")
      );
    }
    if (body) {
      this.logger.debug(body);
    }
    const bodyString = body ? JSON.stringify(body) : undefined;
    const response = await fetch(url, { method, headers, body: bodyString });
    this.logger.debug(`Response: ${response.status}`);
    if (!response.ok) {
      throw new Error(`Response not OK: ${await response.text()}`);
    }
    return response;
  }

  private async fetchJsonWithMethod<T>(
    method: string,
    url: string,
    headers?: Headers,
    body?: unknown
  ): Promise<T> {
    const response = await this.fetchWithMethod(method, url, headers, body);
    return this.extractJson(response) as Promise<T>;
  }
}
