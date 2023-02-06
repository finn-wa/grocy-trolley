import {
  AbstractGrocyProductImporter,
  ImportProductsResult,
  ProductToStock,
} from "@gt/app/import/grocy-importer";
import { ImportListOptions, ImportOptions } from "@gt/app/import/options";
import { GrocyParentProductService } from "@gt/grocy/products/grocy-parent-product-service";
import { GrocyProductService } from "@gt/grocy/products/grocy-product-service";
import { Product } from "@gt/grocy/products/types/Product";
import { GrocyStockService } from "@gt/grocy/stock/grocy-stock-service";
import { PromptProvider } from "@gt/prompts/prompt-provider";
import { Logger } from "@gt/utils/logger";
import { RequestError } from "@gt/utils/rest";
import { firstValueFrom, from, iif, switchMap, toArray } from "rxjs";
import { inject, Lifecycle, scoped } from "tsyringe";
import { FoodstuffsListService } from "../../lists/foodstuffs-list-service";
import { List } from "../../lists/foodstuffs-list.model";
import { FoodstuffsToGrocyConverter, NewProductPayloads } from "./product-converter";

@scoped(Lifecycle.ContainerScoped)
export class FoodstuffsListImporter extends AbstractGrocyProductImporter {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly converter: FoodstuffsToGrocyConverter,
    private readonly listService: FoodstuffsListService,
    private readonly grocyParentProductService: GrocyParentProductService,
    private readonly grocyStockService: GrocyStockService,
    grocyProductService: GrocyProductService,
    @inject("PromptProvider") prompt: PromptProvider
  ) {
    super(grocyProductService, prompt);
  }

  protected async getProductsToImport(options: ImportOptions): Promise<NewProductPayloads[]> {
    let listId;
    if (!listId) {
      const promptId = await this.listService.promptSelectOrCreateList();
      if (!promptId) return [];
      listId = promptId;
    }
    const list = await this.listService.getList(listId);
    const existingProducts = await this.grocyProductService.getAllProducts();
    const existingProductIds = existingProducts
      .filter((p) => p.userfields?.storeMetadata?.PNS)
      .map((product) => product.userfields.storeMetadata?.PNS?.productId);

    const productsToImport = list.products.filter((p) => !existingProductIds.includes(p.productId));
    if (productsToImport.length === 0) {
      this.logger.info("All products have already been imported");
    }
    const parentProducts = Object.values(await this.grocyParentProductService.getParentProducts());
    return firstValueFrom(
      from(productsToImport).pipe(
        switchMap((product) =>
          this.grocyParentProductService
            .promptForMatchingParent$(product.name, product.category, parentProducts)
            .pipe(switchMap((parent) => this.converter.forImportListProduct(product, parent)))
        ),
        toArray()
      )
    );
  }

  protected async convertToStockRequest(
    importResult: ImportProductsResult
  ): Promise<ProductToStock[]> {
    // throw new Error("Method not implemented.");
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
        await this.grocyStockService.addStock(grocyProduct.id, addStockRequest);
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
        await this.grocyStockService.addStock(grocyProduct.id, addStockRequest);
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
    const existingProducts = await this.grocyProductService.getAllProducts();
    return Object.fromEntries(
      existingProducts
        .filter((p) => p.userfields?.storeMetadata?.PNS)
        .map((product) => [product.userfields.storeMetadata?.PNS?.productId, product])
    ) as Record<string, Product>;
  }
}
