import { Response } from "node-fetch";
import { URL, URLSearchParams } from "url";

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

export async function extractJson(response: Response) {
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}
