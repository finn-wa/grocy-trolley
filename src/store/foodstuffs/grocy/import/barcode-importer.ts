import { BarcodeBuddyBarcode, BarcodeBuddyService } from "@gt/barcodebuddy/scraper";
import { GrocyProductService } from "@gt/grocy/products/grocy-product-service";
import { OpenFoodFactsService } from "@gt/openfoodfacts/openfoodfacts";
import { Logger, prettyPrint } from "@gt/utils/logger";
import { RequestError } from "@gt/utils/rest";
import prompts from "prompts";
import { CartProductRef } from "../../cart/foodstuffs-cart.model";
import { resultToCartRef } from "../../search/foodstuffs-search-agent";
import { FoodstuffsSearchService } from "../../search/foodstuffs-search-service";
import { ProductSearchResult } from "../../search/foodstuffs-search.model";
import { FoodstuffsCartImporter } from "./cart-importer";

export class FoodstuffsBarcodeImporter {
  private readonly logger = new Logger(this.constructor.name);
  private readonly nzOffService = new OpenFoodFactsService("nz");
  private readonly worldOffService = new OpenFoodFactsService("world");

  constructor(
    private readonly cartImporter: FoodstuffsCartImporter,
    private readonly bbScraper: BarcodeBuddyService,
    private readonly productService: GrocyProductService,
    private readonly searchService: FoodstuffsSearchService
  ) {}

  async importFromBarcodeBuddy() {
    const barcodes = await this.bbScraper.getBarcodes();
    const cartRefs: Record<string, CartProductRef> = {};
    const notFound: BarcodeBuddyBarcode[] = [];
    for (const barcode of barcodes) {
      this.logger.info("Searching " + prettyPrint(barcode));
      const product = await this.search(barcode).catch(async (error) => {
        if (error instanceof RequestError) {
          this.logger.error(await error.response.text());
        }
        return null;
      });
      if (product === null) {
        notFound.push(barcode);
      } else {
        cartRefs[barcode.barcode] = resultToCartRef(product);
      }
    }
    this.logger.info("Failed to find:\n" + prettyPrint(notFound));
    this.logger.info("Found:\n" + prettyPrint(cartRefs));
    const importProducts = await prompts([
      {
        message: "Import products?",
        name: "value",
        type: "confirm",
      },
    ]);
    if (importProducts.value) {
      return this.importBarcodes(cartRefs);
    }
  }

  async importBarcodes(cartRefs: Record<string, CartProductRef>) {
    await this.cartImporter.importProductRefs(Object.values(cartRefs));
    const products = await this.cartImporter.getProductsByFoodstuffsId();
    for (const [barcode, ref] of Object.entries(cartRefs)) {
      const existing = products[ref.productId];
      existing.barcode = barcode;
      await this.productService.patchProduct(ref.productId, { barcode });
    }
  }

  getTitle(res: ProductSearchResult): string {
    return `${res.ProductBrand} ${res.ProductName} ${res.ProductWeightDisplayName}`;
  }

  async barcodeToProductName(barcode: string): Promise<string | null> {
    const result = await this.nzOffService
      .getInfo(barcode)
      .catch(() => this.worldOffService.getInfo(barcode));
    if (result.status === 0) {
      return null;
    }
    const p = result.product;
    const brand = p.brands ? p.brands.split(",")[0] : "";
    return `${brand} ${p.product_name} ${p.quantity}`;
  }

  private async search(bbb: BarcodeBuddyBarcode): Promise<ProductSearchResult | null> {
    const barcodeRes = await this.searchService.searchAndSelectProduct(bbb.barcode);
    if (barcodeRes !== null) return barcodeRes;
    if (bbb.name) {
      const bbNameRes = await this.searchService.searchAndSelectProduct(bbb.name);
      if (bbNameRes !== null) return bbNameRes;
    }
    this.logger.info("Barcode not found in Foodstuffs search:\n" + prettyPrint(bbb));

    const productName = await this.barcodeToProductName(bbb.barcode);
    if (productName) {
      this.logger.info("Found product name: " + productName);
      return this.searchService.searchAndSelectProduct(productName);
    }
    return null;
  }
}
