import { throwIfInvalid, warnIfInvalid } from "@gt/jtd/ajv";
import { ValidateFunction } from "ajv/dist/types";
import { URL, URLSearchParams } from "url";
import { headersToRaw } from "./headers";
import { Logger, prettyPrint } from "./logger";

export type BodyParser<T> = (res: Response) => Promise<T>;

export abstract class RestService {
  protected abstract readonly baseUrl: string;
  protected abstract readonly logger: Logger;

  protected validateBaseUrl(baseUrl: string): string {
    if (baseUrl.endsWith("/")) {
      throw new Error(`Base URL must not end with a slash, found: ${baseUrl}`);
    }
    return baseUrl;
  }

  protected buildUrl(path: string, params?: Record<string, string>): string {
    const prefix = path.startsWith("/") ? this.baseUrl : this.baseUrl + "/";
    if (!params) {
      return prefix + path;
    }
    const url = new URL(path, this.baseUrl + "/");
    url.search = new URLSearchParams(params).toString();
    return url.toString();
  }

  protected async fetch(url: string, init?: RequestInit): Promise<Response> {
    this.logger.debug(`${init?.method ?? "GET"} ${url}`);
    if (init?.headers) {
      this.logger.trace(prettyPrint(headersToRaw(new Headers(init.headers))));
    }
    if (init?.body) {
      this.logger.trace(init.body);
    }
    const response = await fetch(url, init);
    if (!response.ok) {
      throw new Error(`${response.status}: ${await response.text()}`);
    }
    return response;
  }

  protected async parseJson<T>(res: Response, validate?: ValidateFunction<T>): Promise<T> {
    const jsonString = await res.text();
    let body: T;
    try {
      body = JSON.parse(jsonString) as T;
    } catch (error) {
      throw new Error(`Failed to parse JSON:\n${jsonString}`, { cause: error as Error });
    }
    if (validate) {
      warnIfInvalid(this.logger, validate, body);
    }
    return body;
  }

  protected async fetchAndParse<T>(
    url: string,
    init?: RequestInit,
    validate?: ValidateFunction<T>
  ): Promise<T> {
    const response = await this.fetch(url, init);
    const responseBody = await this.parseJson<T>(response, validate);
    this.logger.trace(prettyPrint(responseBody));
    return responseBody;
  }

  protected async getAndParse<T>(
    url: string,
    init: RequestInit = {},
    validate?: ValidateFunction<T>
  ): Promise<T> {
    return this.fetchAndParse(url, { ...init, method: "GET" }, validate);
  }

  protected async postAndParse<T>(
    url: string,
    init: RequestInit = {},
    validate?: ValidateFunction<T>
  ): Promise<T> {
    return this.fetchAndParse(url, { ...init, method: "POST" }, validate);
  }

  protected async putAndParse<T>(
    url: string,
    init: RequestInit = {},
    validate?: ValidateFunction<T>
  ): Promise<T> {
    return this.fetchAndParse(url, { ...init, method: "PUT" }, validate);
  }

  protected async deleteAndParse<T>(
    url: string,
    init: RequestInit = {},
    validate?: ValidateFunction<T>
  ): Promise<T> {
    return this.fetchAndParse(url, { ...init, method: "DELETE" }, validate);
  }
}
