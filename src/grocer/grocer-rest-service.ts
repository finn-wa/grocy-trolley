import { Logger } from "@gt/utils/logger";
import { RestService } from "@gt/utils/rest";

export class GrocerApiService extends RestService {
  protected baseUrl = "https://api.grocer.nz/";
  protected readonly logger = new Logger(this.constructor.name);
}
