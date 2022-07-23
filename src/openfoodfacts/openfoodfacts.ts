import { Logger, prettyPrint } from "@gt/utils/logger";
import { RestService } from "@gt/utils/rest";

export interface OpenFoodFactsProduct {
  /** e.g. Noodle bowl */
  product_name: string;
  /** e.g. 120 g */
  quantity: string;
  /** e.g. Nongshim,Nongshim Co. */
  brands: string;
}

interface ProductResponseBody {
  code: string;
  product: OpenFoodFactsProduct;
  status: 0 | 1;
  status_verbose: string;
}

export class OpenFoodFactsService extends RestService {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(readonly region: "world" | "nz") {
    super(`https://${region}.openfoodfacts.org/api/v0/product`);
    this.validateBaseUrl(this.baseUrl);
  }

  async getInfo(barcode: string): Promise<ProductResponseBody> {
    this.logger.info("Searching OFF for barcode " + barcode);
    const body = await this.getAndParse<ProductResponseBody>(this.buildUrl(barcode + ".json"), {
      headers: new Headers({ "User-Agent": "GrocyTrolley v0.0.1 / finnwa24@gmail.com" }),
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
