import { headers, HeadersBuilder } from "@grocy-trolley/utils/headers-builder";
import { RestService } from "@grocy-trolley/utils/rest";
import { FoodstuffsAuthService } from ".";

export abstract class FoodstuffsRestService extends RestService {
  constructor(protected readonly authService: FoodstuffsAuthService) {
    super();
  }

  protected authHeaders(): HeadersBuilder {
    return headers().cookie(this.authService.cookie);
  }

  protected get baseUrl() {
    return this.authService.baseUrl;
  }
}
