import { Logger } from "@gt/utils/logger";
import { inject, Lifecycle, scoped } from "tsyringe";
import { COUNTDOWN_URL } from "../models";
import { CountdownAuthHeaderProvider } from "../rest/countdown-auth-header-provider";
import { CountdownRestService } from "../rest/countdown-rest-service";
import { Trolley } from "./types/Trolley";
import { getTrolleySchema } from "./types/Trolley/schema";

@scoped(Lifecycle.ContainerScoped)
export class CountdownTrolleyService extends CountdownRestService {
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly baseUrl = this.validateBaseUrl(`${COUNTDOWN_URL}/api`);

  constructor(
    @inject(CountdownAuthHeaderProvider) authHeaderProvider: CountdownAuthHeaderProvider
  ) {
    super(authHeaderProvider);
  }

  async getTrolley(): Promise<Trolley> {
    const builder = await this.authHeaders();
    return this.getAndParse(
      this.buildUrl("/v1/trolleys/my"),
      { headers: builder.acceptJson().build() },
      getTrolleySchema()
    );
  }
}
