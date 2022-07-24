import { Logger, prettyPrint } from "@gt/utils/logger";
import { RestService } from "@gt/utils/rest";
import { version } from "@gt/utils/version";

export interface OpenFoodFactsProduct {
  /** @example "Noodle bowl"*/
  product_name: string;
  /** @example "120 g" */
  quantity: string;
  /** @example "Nongshim,Nongshim Co." */
  brands: string;
}

interface ProductResponseBody {
  code: string;
  product: OpenFoodFactsProduct;
  status: 0 | 1;
  status_verbose: string;
}

export class OpenFoodFactsService extends RestService {
  protected readonly baseUrl: string;
  protected readonly logger: Logger;
  protected readonly headers = {
    "User-Agent": `GrocyTrolley ${version} | https://github.com/finn-wa/grocy-trolley`,
  };

  constructor(readonly region: "world" | "nz") {
    super();
    this.baseUrl = this.validateBaseUrl(`https://${region}.openfoodfacts.org/api/v0/product`);
    this.logger = new Logger(`${this.constructor.name}[${region}]`);
  }

  async getInfo(barcode: string): Promise<ProductResponseBody> {
    this.logger.info(`Searching OFF for barcode ${barcode}`);
    const body = await this.getAndParse<ProductResponseBody>(this.buildUrl(barcode + ".json"), {
      headers: this.headers,
    });
    if (body.status === 0) {
      this.logger.warn(
        `OpenFoodFacts response status not OK: ${body.status_verbose}\n${prettyPrint(body)}`
      );
      return body;
    }
    // Abridged product because the full thing is ~2000 lines long formatted
    const { product_name, quantity, brands } = body.product;
    this.logger.info("Found product in OFF: " + product_name);
    return { ...body, product: { product_name, quantity, brands } };
  }
}
