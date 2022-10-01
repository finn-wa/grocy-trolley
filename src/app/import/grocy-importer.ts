import {
  CreatedProductResponse,
  GrocyProductService,
} from "@gt/grocy/products/grocy-product-service";
import { PromptProvider } from "@gt/prompts/prompt-provider";
import { NewProductPayloads } from "@gt/store/foodstuffs/grocy/import/product-converter";
import { prettyPrint } from "@gt/utils/logger";
import { Logger } from "ajv";
import { ImportOptions } from "./options";

export interface BaseProductImport {
  readonly payloads: NewProductPayloads;
}
export interface QueuedProductImport extends BaseProductImport {
  readonly status: "queued";
}
export interface SuccessfulProductImport extends BaseProductImport {
  readonly status: "success";
  readonly response: CreatedProductResponse;
}
export interface ErroredProductImport extends BaseProductImport {
  readonly status: "error";
  readonly error: unknown;
}
export type ProductImport = QueuedProductImport | SuccessfulProductImport | ErroredProductImport;

export class ProductImportHelper {
  private _state: ProductImport;

  constructor(payloads: NewProductPayloads) {
    this._state = { status: "queued", payloads };
  }

  get state(): ProductImport {
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
  state: ProductImport[];
  error?: Error;
}

export interface GrocyImporter {
  importProducts(options: ImportOptions): Promise<ImportProductsResult>;
}

export abstract class AbstractGrocyImporter implements GrocyImporter {
  protected abstract readonly logger: Logger;

  constructor(
    private readonly grocyProductService: GrocyProductService,
    private readonly prompt: PromptProvider
  ) {}

  protected abstract getProductsToImport(
    options: ImportOptions
  ): Promise<NewProductPayloads[]> | NewProductPayloads[];

  async importProducts(options: ImportOptions): Promise<ImportProductsResult> {
    const productsToImport = await this.getProductsToImport(options);
    const importHelpers = productsToImport.map((payloads) => new ProductImportHelper(payloads));
    for (const productImport of importHelpers) {
      try {
        const createdProduct = await this.grocyProductService.createProduct(
          productImport.payloads.product,
          productImport.payloads.quConversions
        );
        productImport.setSuccessState(createdProduct);
      } catch (error) {
        productImport.setErrorState(error);
        this.logger.error(prettyPrint(error));
        const continueImport = await this.prompt.confirm(
          `Error importing product ${productImport.payloads.product.name}! Continue importing remaining products?`
        );
        if (!continueImport) break;
      }
    }
    // TODO: print summary
    // TODO: support stocking imported products
    return { state: importHelpers.map((helper) => helper.state) };
  }
}
