import fetch, { Headers, Response } from "node-fetch";
import { URL, URLSearchParams } from "url";
import { prettyPrint } from "./logging-utils";

export function buildUrl(
  baseUrl: string,
  path: string,
  params?: Record<string, string>
): string {
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

export async function extractJson(response: Response) {
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const body = response.json();
  console.log("Response:");
  console.log(prettyPrint(body));
  return body;
}

async function fetchWithMethod(
  method: string,
  url: string,
  headers?: Headers,
  body?: any
): Promise<Response> {
  console.log(`${method} ${url}`);
  if (headers) {
    console.log(
      Array.from(headers.entries())
        .map(([k, v]) => `${k}=${v}`)
        .join("\n")
    );
  }
  if (body) {
    console.log(body);
  }
  const bodyString = body ? JSON.stringify(body) : undefined;
  return fetch(url, { method, headers, body: bodyString });
}

async function fetchJsonWithMethod<T>(
  method: string,
  url: string,
  headers?: Headers,
  body?: any
): Promise<T> {
  const response = await fetchWithMethod(method, url, headers, body);
  return extractJson(response);
}

export async function get(
  url: string,
  headers?: Headers,
  body?: any
): Promise<Response> {
  return fetchWithMethod("GET", url, headers, body);
}

export async function getForJson<T>(
  url: string,
  headers?: Headers,
  body?: any
): Promise<T> {
  return fetchJsonWithMethod("GET", url, headers, body);
}

export async function post(
  url: string,
  headers?: Headers,
  body?: any
): Promise<Response> {
  return fetchWithMethod("POST", url, headers, body);
}

export async function postForJson<T>(
  url: string,
  headers?: Headers,
  body?: any
): Promise<T> {
  return fetchJsonWithMethod("POST", url, headers, body);
}

export async function put(
  url: string,
  headers?: Headers,
  body?: any
): Promise<Response> {
  return fetchWithMethod("PUT", url, headers, body);
}

export async function putForJson<T>(
  url: string,
  headers?: Headers,
  body?: any
): Promise<T> {
  return fetchJsonWithMethod("PUT", url, headers, body);
}
