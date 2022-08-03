import { RestService } from "@gt/utils/rest";
import { COUNTDOWN_URL } from "../models";
import { CountdownAuthHeaderProvider } from "./countdown-auth-header-provider";

export abstract class CountdownRestService extends RestService {
  protected readonly baseUrl = this.validateBaseUrl(`${COUNTDOWN_URL}/api`);

  constructor(protected readonly authHeaderProvider: CountdownAuthHeaderProvider) {
    super();
  }

  protected authHeaders() {
    return this.authHeaderProvider.authHeaders();
  }
}
