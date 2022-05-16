import { JTDParser } from "ajv/dist/types";
import prompts from "prompts";
import { URL, URLSearchParams } from "url";
import { headersToRaw } from "./headers";
import { Logger, prettyPrint } from "./logger";

export type BodyParser<T> = (res: Response) => Promise<T>;

export const textParser: BodyParser<string> = (res) => res.text();

export async function defaultJsonParser<T>(res: Response): Promise<T> {
  const jsonString = await res.text();
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    throw new Error(`Failed to parse JSON:\n${jsonString}`, { cause: error as Error });
  }
}

export function jtdParser<T>(name: string, parser: JTDParser<T>): BodyParser<T> {
  return async (res: Response) => {
    const jsonString = await res.text();
    const body = parser(jsonString);
    if (body) {
      return body;
    }
    const { position, message } = parser;
    const logger = new Logger(name);
    const errorMsg = `JSON validation error:\n${jsonString}\n\nError at ${position}: ${message}`;
    logger.warn(errorMsg);
    logger.info("Trying JSON.parse...");
    const jsonBody = JSON.parse(jsonString) as T;
    const choice = await prompts({
      name: "continue",
      type: "confirm",
      message: "JSON.parse successful, continue?",
    });
    if (!choice.continue) {
      throw new Error(errorMsg);
    }
    return jsonBody;
  };
}

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
    this.logger.debug(`Response: ${response.status}`);
    if (!response.ok) {
      throw new Error(`${response.status}: ${await response.text()}`);
    }
    return response;
  }

  protected async fetchAndParse<T>(
    url: string,
    init?: RequestInit,
    bodyParser: BodyParser<T> = defaultJsonParser
  ): Promise<T> {
    const response = await this.fetch(url, init);
    const responseBody = await bodyParser(response);
    this.logger.trace(prettyPrint(responseBody));
    return responseBody;
  }

  protected async getAndParse<T>(
    url: string,
    init: RequestInit = {},
    bodyParser: BodyParser<T> = defaultJsonParser
  ): Promise<T> {
    return this.fetchAndParse(url, { ...init, method: "GET" }, bodyParser);
  }

  protected async postAndParse<T>(
    url: string,
    init: RequestInit = {},
    bodyParser: BodyParser<T> = defaultJsonParser
  ): Promise<T> {
    return this.fetchAndParse(url, { ...init, method: "POST" }, bodyParser);
  }

  protected async putAndParse<T>(
    url: string,
    init: RequestInit = {},
    bodyParser: BodyParser<T> = defaultJsonParser
  ): Promise<T> {
    return this.fetchAndParse(url, { ...init, method: "PUT" }, bodyParser);
  }

  protected async deleteAndParse<T>(
    url: string,
    init: RequestInit = {},
    bodyParser: BodyParser<T> = defaultJsonParser
  ): Promise<T> {
    return this.fetchAndParse(url, { ...init, method: "DELETE" }, bodyParser);
  }
}
