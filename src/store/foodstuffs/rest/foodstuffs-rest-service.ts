import { StoreRestService } from "@gt/store/shared/rest/store-rest-service";
import { PAKNSAVE_URL } from "../models";

export abstract class FoodstuffsRestService extends StoreRestService {
  protected readonly baseUrl = this.validateBaseUrl(`${PAKNSAVE_URL}/CommonApi`);
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
}
