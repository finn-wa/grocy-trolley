import { Logger } from "utils/logger";
import { paths } from "./api";
import { GrocySchemas } from "./grocy-model";
import { GrocyRestService } from "./grocy-rest-service";

export type StockAction = "add" | "consume" | "transfer" | "inventory" | "open";

type StockSchemas<A extends StockAction> = paths[`/stock/products/{productId}/${A}`];

export type StockActionRequestBody<A extends StockAction> =
  StockSchemas<A>["post"]["requestBody"]["content"]["application/json"];

export type StockLogEntry = GrocySchemas["StockLogEntry"];

export class GrocyStockService extends GrocyRestService {
  protected readonly logger = new Logger(this.constructor.name);

  async stock<T extends StockAction>(
    action: T,
    id: string | number,
    requestBody: StockActionRequestBody<T>
  ): Promise<StockLogEntry> {
    return this.postForJson(
      this.buildUrl(`stock/products/${id}/${action}`),
      this.authHeaders().contentTypeJson().acceptJson().build(),
      requestBody
    );
  }
}
