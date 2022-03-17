import { headers, HeadersBuilder } from "utils/headers-builder";
import { RestService } from "utils/rest";
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
