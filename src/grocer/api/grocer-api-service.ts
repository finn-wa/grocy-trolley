import { Logger } from "@gt/utils/logger";
import { RestService } from "@gt/utils/rest";
import { getStoresSchema } from "./types/Stores/schema";

export class GrocerApiService extends RestService {
  protected readonly baseUrl = "https://api.grocer.nz";
  protected readonly logger = new Logger(this.constructor.name);

  async getStores() {
    return this.getAndParse(this.buildUrl("/stores"), {}, getStoresSchema());
  }
}
