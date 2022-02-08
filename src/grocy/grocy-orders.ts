import { GrocyRestService } from "./grocy-rest-service";
import { GrocyUserEntityService } from "./grocy-user-entities";

export class GrocyOrderService extends GrocyRestService {
  static readonly entityName = "order";

  constructor(
    apiKey: string,
    readonly baseUrl: string,
    private readonly userEntityService: GrocyUserEntityService
  ) {
    super(apiKey);
  }

  getOrders() {
    // return this.getEntities<"">("userentities");
  }
}
