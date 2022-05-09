import { HeadersBuilder, headersFromRaw, headersToRaw } from "@gt/utils/headers";
import { prettyPrint } from "@gt/utils/logger";
import { RestService } from "@gt/utils/rest";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { getCacheDirForEmail } from "../../../utils/cache";
import { PAKNSAVE_URL } from "../models";
import { FoodstuffsUserAgent } from "./foodstuffs-user-agent";

const HEADERS = {
  allowed: [
    "host",
    "user-agent",
    "accept",
    "accept-language",
    "accept-encoding",
    "referer",
    "dnt",
    "cookie",
    "sec-fetch-dest",
    "sec-fetch-mode",
    "sec-fetch-site",
  ],
  disallowed: [
    "accept",
    "content-type",
    "x-newrelic-id",
    "newrelic",
    "traceparent",
    "tracestate",
    "__requestverificationtoken",
    "connection",
    "pragma",
    "cache-control",
    "te",
  ],
};

export abstract class FoodstuffsRestService extends RestService {
  protected readonly baseUrl = this.validateBaseUrl(`${PAKNSAVE_URL}/CommonApi`);
  private _authHeaders: Headers | null = null;
  private readonly headersCachePath: string;

  constructor(protected readonly userAgent: FoodstuffsUserAgent) {
    super();
    this.headersCachePath = path.join(
      getCacheDirForEmail(userAgent.email ?? "anon"),
      "headers.json"
    );
  }

  protected async authHeaders(): Promise<HeadersBuilder> {
    if (this._authHeaders) {
      return new HeadersBuilder(this._authHeaders);
    }
    const cachedHeaders = await this.getCachedHeaders();
    if (cachedHeaders !== null) {
      this._authHeaders = cachedHeaders;
    } else {
      this._authHeaders = await this.getAllowedHeadersFromBrowser();
      await this.cacheHeaders(this._authHeaders);
    }
    return new HeadersBuilder(this._authHeaders);
  }

  private async getCachedHeaders(): Promise<Headers | null> {
    try {
      const headersStr = await readFile(this.headersCachePath, { encoding: "utf-8" });
      const headers = headersFromRaw(JSON.parse(headersStr) as Record<string, string[]>);
      const cart = await this.getForJson(
        this.buildUrl("/Cart/Index"),
        new HeadersBuilder(headers).acceptJson().build()
      );
      if (!cart || typeof cart !== "object") {
        throw new Error("Test getCart request failed: " + prettyPrint(cart));
      }
      return headers;
    } catch (error) {
      this.logger.info("No valid cached headers found");
      this.logger.debug(error);
      return null;
    }
  }

  private async getAllowedHeadersFromBrowser(): Promise<Headers> {
    const headers = await this.userAgent.getHeaders();
    for (const name of [...headers.keys()]) {
      const lowercaseName = name.toLowerCase();
      if (HEADERS.disallowed.includes(lowercaseName)) {
        headers.delete(name);
      } else if (!HEADERS.allowed.includes(lowercaseName)) {
        this.logger.warn(`Unrecognised header: ${name}`);
      }
    }
    return headers;
  }

  private async cacheHeaders(headers: Headers): Promise<void> {
    const headersString = prettyPrint(headersToRaw(headers));
    this.logger.debug("Caching headers: " + headersString);
    await writeFile(this.headersCachePath, headersString);
  }
}
