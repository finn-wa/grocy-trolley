import { HeadersBuilder } from "@gt/utils/headers";
import { RestService } from "@gt/utils/rest";
import { FoodstuffsUserAgent } from "..";
import { PAKNSAVE_URL } from "../foodstuffs.model";

export abstract class FoodstuffsRestService extends RestService {
  protected readonly baseUrl = this.validateBaseUrl(`${PAKNSAVE_URL}/CommonApi`);
  private _authHeaders: Headers | null = null;

  private readonly cookiesPath = "src/resources/cache/cookies.json";
  private readonly allowedHeaders = [
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
  ];
  private readonly disallowedHeaders = [
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
  ];

  constructor(protected readonly userAgent: FoodstuffsUserAgent) {
    super();
  }

  protected async authHeaders(): Promise<HeadersBuilder> {
    if (!this._authHeaders) {
      const headers = await this.userAgent.getHeaders();
      for (const name of [...headers.keys()]) {
        const lowercaseName = name.toLowerCase();
        if (this.disallowedHeaders.includes(lowercaseName)) {
          headers.delete(name);
        } else if (!this.allowedHeaders.includes(lowercaseName)) {
          this.logger.warn(`Unrecognised header: ${name}`);
        }
      }
      this._authHeaders = headers;
    }
    return new HeadersBuilder(this._authHeaders);
  }
}
