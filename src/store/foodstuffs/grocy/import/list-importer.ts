import { Logger } from "@gt/utils/logger";
import { GrocyServices } from "grocy";
import prompts from "prompts";
import { FoodstuffsListProduct } from "../../models";
import { FoodstuffsListService } from "../../lists/foodstuffs-list-service";
import { List } from "../../lists/foodstuffs-list.model";
import { FoodstuffsToGrocyConverter } from "./product-converter";
import { Product } from "@gt/grocy/products/types/Product";
import { RequestError } from "@gt/utils/rest";

export class FoodstuffsListImporter {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly converter: FoodstuffsToGrocyConverter,
    private readonly listService: FoodstuffsListService,
    private readonly grocy: Pick<
      GrocyServices,
      "productService" | "parentProductService" | "stockService"
    >
  ) {}

  async selectAndImportList() {
    const listId = await this.listService.selectList();
    return this.importList(listId);
  }

  async selectAndStockList() {
    const listId = await this.listService.selectList();
    return this.stockProductsFromList(listId);
  }

  async importList(id: string): Promise<void> {
    const list = await this.listService.getList(id);
    const existingProducts = await this.grocy.productService.getAllProducts();
    const existingProductIds = existingProducts
      .filter((p) => p.userfields?.storeMetadata?.PNS)
      .map((product) => product.userfields.storeMetadata?.PNS?.productId);

    const productsToImport = list.products.filter((p) => !existingProductIds.includes(p.productId));
    if (productsToImport.length === 0) {
      this.logger.info("All products have already been imported");
      return;
    }
    const parentProducts = Object.values(await this.grocy.parentProductService.getParentProducts());
    const newProducts: { id: string; product: FoodstuffsListProduct }[] = [];

    for (const product of productsToImport) {
      const parent = await this.grocy.parentProductService.promptForMatchingParent(
        product.name,
        product.category,
        parentProducts
      );
      const payloads = await this.converter.forImportListProduct(product, parent);
      this.logger.info(`Importing product ${payloads.product.name}...`);
      const createdProduct = await this.grocy.productService.createProduct(
        payloads.product,
        payloads.quConversions
      );
      newProducts.push({ id: createdProduct.id, product });
    }
    const stock: { value: boolean } = await prompts({
      name: "value",
      message: "Stock imported products?",
      type: "confirm",
    });
    if (stock.value) {
      await this.stockProductsFromList(list);
    }
  }

  async stockProductsFromList(list: List): Promise<void>;
  async stockProductsFromList(listId: string): Promise<void>;
  async stockProductsFromList(listOrId: List | string): Promise<void> {
    let list: List;
    if (typeof listOrId === "string") {
      list = await this.listService.getList(listOrId);
    } else {
      list = listOrId;
    }
    const productsByPnsId = await this.getProductsByFoodstuffsId();
    // Not including unavailable products for stock
    for (const product of list.products) {
      const grocyProduct = productsByPnsId[product.productId];
      if (!grocyProduct) {
        this.logger.error(
          `Product ${product.productId} (${product.name}) does not exist in Grocy, skipping`
        );
        continue;
      }
      this.logger.info("Stocking product: " + grocyProduct.name);
      try {
        const addStockRequest = await this.converter.forAddStock(grocyProduct);
        await this.grocy.stockService.addStock(grocyProduct.id, addStockRequest);
      } catch (error) {
        this.logger.error("Error stocking product");
        if (error instanceof RequestError) {
          this.logger.error(await error.response.text());
        } else {
          this.logger.error(error);
        }
      }
    }
  }

  async getProductsByFoodstuffsId(): Promise<Record<string, Product>> {
    const existingProducts = await this.grocy.productService.getAllProducts();
    return Object.fromEntries(
      existingProducts
        .filter((p) => p.userfields?.storeMetadata?.PNS)
        .map((product) => [product.userfields.storeMetadata?.PNS?.productId, product])
    ) as Record<string, Product>;
  }
}
