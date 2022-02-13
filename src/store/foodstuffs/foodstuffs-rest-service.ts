import { buildUrl } from "@grocy-trolley/utils/fetch-utils";
import { headers, HeadersBuilder } from "@grocy-trolley/utils/headers-builder";
import { FoodstuffsAuthService } from ".";

export abstract class FoodstuffsRestService {
  constructor(protected readonly authService: FoodstuffsAuthService) {}

  protected authHeaders(): HeadersBuilder {
    return headers().cookie(this.authService.cookie);
  }

  protected buildUrl(path: string, params?: Record<string, string>): string {
    return buildUrl(this.authService.baseUrl, path, params);
  }
}
