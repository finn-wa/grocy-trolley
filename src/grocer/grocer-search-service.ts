import { Logger } from "@gt/utils/logger";
import { RestService } from "@gt/utils/rest";

export class GrocerRestService extends RestService {
  protected baseUrl = "https://search.grocer.nz/";
  protected logger = new Logger(this.constructor.name);

  // search()
}
