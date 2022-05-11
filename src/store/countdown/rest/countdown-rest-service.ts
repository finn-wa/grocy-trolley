import { StoreRestService } from "@gt/store/shared/rest/store-rest-service";
import { COUNTDOWN_URL } from "../models";
import { CountdownUserAgent } from "./countdown-user-agent";

export abstract class CountdownRestService extends StoreRestService {
  protected readonly baseUrl = this.validateBaseUrl(`${COUNTDOWN_URL}/api`);
  protected readonly headers = {
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

  constructor(protected readonly userAgent: CountdownUserAgent) {
    super(userAgent);
  }
}
