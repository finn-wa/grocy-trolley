import { RestService } from "@gt/utils/rest";
import { PAKNSAVE_URL } from "../models";
import { FoodstuffsAuthHeaderProvider } from "./foodstuffs-auth-header-provider";

export abstract class FoodstuffsRestService extends RestService {
  protected readonly baseUrl = this.validateBaseUrl(`${PAKNSAVE_URL}/CommonApi`);

  constructor(protected readonly authHeaderProvider: FoodstuffsAuthHeaderProvider) {
    super();
  }

  protected authHeaders() {
    return this.authHeaderProvider.authHeaders();
  }
}
