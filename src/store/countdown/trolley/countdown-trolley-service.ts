import { Logger } from "@gt/utils/logger";
import { COUNTDOWN_URL } from "../models";
import { CountdownRestService } from "../rest/countdown-rest-service";
import { Trolley } from "./types/getTrolley";

export class CountdownTrolleyService extends CountdownRestService {
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly baseUrl = this.validateBaseUrl(`${COUNTDOWN_URL}/api`);

  async getTrolley(): Promise<Trolley> {
    const builder = await this.authHeaders();
    return this.getAndParse(this.buildUrl("/v1/trolleys/my"), {
      headers: builder.acceptJson().build(),
    });
  }
}
