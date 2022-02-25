import fetch, { Headers, Response } from "node-fetch";
import { URL, URLSearchParams } from "url";
import { logger, prettyPrint } from "./logger";

export function buildUrl(baseUrl: string, path: string, params?: Record<string, string>): string {
  if (!baseUrl.endsWith("/")) {
    throw new Error(`Base URL must end with a slash, found '${baseUrl}'`);
  }
  if (!params) {
    return baseUrl + path;
  }
  const url = new URL(path, baseUrl);
  url.search = new URLSearchParams(params).toString();
  return url.toString();
}

export async function extractJson(response: Response): Promise<unknown> {
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const body: unknown = await response.json();
  logger.debug(prettyPrint(body));
  return body;
}

async function fetchWithMethod(
  method: string,
  url: string,
  headers?: Headers,
  body?: unknown
): Promise<Response> {
  logger.info(`${method} ${url}`);
  if (headers) {
    logger.debug(
      Array.from(headers.entries())
        .map(([k, v]) => `${k}=${v}`)
        .join("\n")
    );
  }
  if (body) {
    logger.debug(body);
  }
  const bodyString = body ? JSON.stringify(body) : undefined;
  const response = await fetch(url, { method, headers, body: bodyString });
  logger.debug(`Response: ${response.status}`);
  if (!response.ok) {
    throw new Error(`Response not OK: ${await response.text()}`);
  }
  return response;
}

async function fetchJsonWithMethod<T>(
  method: string,
  url: string,
  headers?: Headers,
  body?: unknown
): Promise<T> {
  const response = await fetchWithMethod(method, url, headers, body);
  return extractJson(response) as Promise<T>;
}

export async function get(url: string, headers?: Headers, body?: unknown): Promise<Response> {
  return fetchWithMethod("GET", url, headers, body);
}

export async function getForJson<T>(url: string, headers?: Headers, body?: unknown): Promise<T> {
  return fetchJsonWithMethod("GET", url, headers, body);
}

export async function post(url: string, headers?: Headers, body?: unknown): Promise<Response> {
  return fetchWithMethod("POST", url, headers, body);
}

export async function postForJson<T>(url: string, headers?: Headers, body?: unknown): Promise<T> {
  return fetchJsonWithMethod("POST", url, headers, body);
}

export async function put(url: string, headers?: Headers, body?: unknown): Promise<Response> {
  return fetchWithMethod("PUT", url, headers, body);
}

export async function putForJson<T>(url: string, headers?: Headers, body?: unknown): Promise<T> {
  return fetchJsonWithMethod("PUT", url, headers, body);
}

export async function deletus(url: string, headers?: Headers): Promise<Response> {
  return fetchWithMethod("DELETE", url, headers);
}

export async function deleteForJson<T>(url: string, headers?: Headers): Promise<T> {
  return fetchJsonWithMethod("DELETE", url, headers);
}
