import {
  CreatedProductResponse,
  GrocyProductService,
} from "@gt/grocy/products/grocy-product-service";
import { StockAddRequest } from "@gt/grocy/stock/types";
import { PromptProvider } from "@gt/prompts/prompt-provider";
import { NewProductPayloads } from "@gt/store/foodstuffs/grocy/import/product-converter";
import { Logger, prettyPrint } from "@gt/utils/logger";
import { Store } from "@gt/utils/store";
import { BehaviorSubject } from "rxjs";
import { ImportListOptions, ImportOptions } from "./options";

export interface BaseProductImport {
  readonly payloads: NewProductPayloads;
}

export type Status = "queued" | "success" | "error";
export type WithStatus<T extends Status> = { readonly status: T };

export interface QueuedProductImport extends BaseProductImport, WithStatus<"queued"> {}

export interface SuccessfulProductImport extends BaseProductImport, WithStatus<"success"> {
  readonly response: CreatedProductResponse;
}
export interface ErroredProductImport extends BaseProductImport, WithStatus<"error"> {
  readonly error: unknown;
}

export type ProductImportStatus =
  | QueuedProductImport
  | SuccessfulProductImport
  | ErroredProductImport;

export interface ProductToStock {
  id: string;
  request: StockAddRequest;
}

export type ProductStockStatus<T extends Status = Status> = WithStatus<T> & ProductToStock;

export class ProductImportOperation {
  private _state: ProductImportStatus;

  constructor(payloads: NewProductPayloads) {
    this._state = { status: "queued", payloads };
  }

  get state(): ProductImportStatus {
    return { ...this.state };
  }

  get payloads(): NewProductPayloads {
    return this._state.payloads;
  }

  setErrorState(error: unknown): ErroredProductImport {
    if (this._state.status !== "queued") {
      throw new Error(`Illegal state transition: ${this._state.status} -> error`);
    }
    this._state = { ...this._state, status: "error", error };
    return this._state;
  }

  setSuccessState(response: CreatedProductResponse) {
    if (this._state.status !== "queued") {
      throw new Error(`Illegal state transition: ${this._state.status} -> success`);
    }
    this._state = { ...this._state, status: "success", response };
  }
}

export interface ImportProductsResult {
  imports: ProductImportStatus[];
  stock: ProductStockStatus[];
  error?: Error;
}

export interface GrocyProductImporter {
  importProducts(options: ImportOptions): Promise<ImportProductsResult>;
  // stockProducts(products: ImportProductsResult): Promise<ProductStockStatus<Status>[]>;
}

type ImporterStore = {
  imports: ProductImportOperation[];
  stock: ProductStockStatus[];
}

export abstract class AbstractGrocyProductImporter implements GrocyProductImporter {
  readonly store = new Store<ImporterStore>({imports: [], stock: []});

  protected abstract readonly logger: Logger;

  constructor(
    protected readonly grocyProductService: GrocyProductService,
    protected readonly prompt: PromptProvider
  ) {}

  protected abstract getProductsToImport(
    options: ImportOptions
  ): NewProductPayloads[] | Promise<NewProductPayloads[]>;

  protected abstract convertToStockRequest(
    importResult: ImportProductsResult
  ): ProductToStock[] | Promise<ProductToStock[]>;

  async importProducts(options: ImportOptions): Promise<ImportProductsResult> {
    const productsToImport = await this.getProductsToImport(options);

    this.store.updateIdState('imports', (imports) => imports.concat(
        productsToImport.map((payloads) => new ProductImportOperation(payloads))
      )
    );
    let ignoreErrors = false;
    const importState = await this.store.selectId('imports');
    for (let i = 0; i < importState.length; i++) {
      const productImport = importState[i];
      try {
        const createdProduct = await this.grocyProductService.createProduct(
          productImport.payloads.product,
          productImport.payloads.quConversions
        );
        productImport.setSuccessState(createdProduct);
        this.store.setIdState('imports', importState);
      } catch (error) {
        productImport.setErrorState(error);
        this.store.setIdState('imports', importState);
        this.logger.error(prettyPrint(error));
        if (!ignoreErrors) {
          const continueImport = await this.prompt.select(
            `Error importing product ${productImport.payloads.product.name}! Select action:`,
            [
              { title: "Ignore error", value: "ignore" as const },
              { title: "Ignore all errors for this import", value: "ignoreAll" as const },
            ],
            { includeExitOption: true }
          );
          if (!continueImport) {
            break;
          }
          if (continueImport === "ignoreAll") {
            ignoreErrors = true;
          }
        }
      }
    }
    // TODO: print nice summary
    const state = importOperations.map((helper) => helper.state);
    this.logger.debug(prettyPrint(state));
    // TODO: support stocking imported products
    const stockImportedProducts = await this.prompt.confirm(
      "Stock successfully imported products?"
    );
    if (stockImportedProducts) {
      products.
      const productsToStock = await this.convertToStockRequest({ imports: state });
      const stockState = await this.stockProducts(productsToStock);
      return { imports: state, stock: stockState };
    }
    return { imports: state };
  }

  protected async stockProducts(products: ProductToStock[]): Promise<ProductStockStatus[]> {}

  async importAndStockProducts(options: ImportOptions) {}
}
