import { StoreRestService } from "@gt/store/shared/rest/store-rest-service";
import { HeadersBuilder } from "@gt/utils/headers";
import { prettyPrint } from "@gt/utils/logger";
import { PAKNSAVE_URL } from "../models";

export abstract class FoodstuffsRestService extends StoreRestService {
  protected readonly baseUrl = this.validateBaseUrl(`${PAKNSAVE_URL}/CommonApi`);
  protected readonly headers = {
    allowed: [
      "host",
      "user-agent",
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

  protected async isValid(headers: Headers): Promise<boolean> {
    try {
      const cart = await this.getAndParse(this.buildUrl("/Cart/Index"), {
        headers: new HeadersBuilder(headers).acceptJson().build(),
      });
      if (!cart || typeof cart !== "object") {
        throw new Error("Test getCart request failed: " + prettyPrint(cart));
      }
    } catch (error) {
      this.logger.debug("Headers failed validation", headers, error);
      return false;
    }
    return true;
  }
}
