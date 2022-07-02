import { Logger } from "@gt/utils/logger";
import { GrocyRestService } from "../rest/grocy-rest-service";
import { StockAction, StockActionRequestBody, StockAddRequest, StockLogEntry } from "./types";

export class GrocyStockService extends GrocyRestService {
  protected readonly logger = new Logger(this.constructor.name);

  async addStock(id: string, requestBody: StockAddRequest): Promise<StockLogEntry> {
    return this.postAndParse(this.buildUrl(`stock/products/${id}/add`), {
      headers: this.authHeaders().contentTypeJson().acceptJson().build(),
      body: JSON.stringify(requestBody),
    });
  }

  async stock<T extends StockAction>(
    action: T,
    id: string | number,
    requestBody: StockActionRequestBody<T>
  ): Promise<StockLogEntry> {
    return this.postAndParse(this.buildUrl(`stock/products/${id}/${action}`), {
      headers: this.authHeaders().contentTypeJson().acceptJson().build(),
      body: JSON.stringify(requestBody),
    });
  }
}
