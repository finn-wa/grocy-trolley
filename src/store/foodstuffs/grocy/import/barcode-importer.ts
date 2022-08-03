import { GrocyProductService } from "@gt/grocy/products/grocy-product-service";
import { OpenFoodFactsService } from "@gt/openfoodfacts/openfoodfacts";
import { singleton } from "tsyringe";
import { CartProductRef } from "../../cart/foodstuffs-cart.model";
import { ProductSearchResult } from "../../search/foodstuffs-search.model";
import { FoodstuffsCartImporter } from "./cart-importer";

@singleton()
export class FoodstuffsBarcodeImporter {
  private readonly nzOffService = new OpenFoodFactsService("nz");
  private readonly worldOffService = new OpenFoodFactsService("world");

  constructor(
    private readonly cartImporter: FoodstuffsCartImporter,
    private readonly productService: GrocyProductService
  ) {}

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
}
