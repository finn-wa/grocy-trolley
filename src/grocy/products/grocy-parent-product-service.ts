import { AppTokens } from "@gt/app/di";
import { PromptProvider } from "@gt/prompts/prompt-provider";
import { Logger } from "@gt/utils/logger";
import { inject, Lifecycle, scoped } from "tsyringe";
import { GrocyProductGroup } from "../grocy-config";
import { GrocyProductGroupIdLookupService } from "../id-lookup/grocy-product-group-id-lookup-service";
import { GrocyRestService } from "../rest/grocy-rest-service";
import { GrocyProductService } from "./grocy-product-service";
import { ParentProduct } from "./types";
import { Product } from "./types/Product";

@scoped(Lifecycle.ContainerScoped)
export class GrocyParentProductService extends GrocyRestService {
  protected readonly logger = new Logger(this.constructor.name);
  private parentProducts: Record<string, ParentProduct> | null = null;

  constructor(
    private readonly productGroupIdService: GrocyProductGroupIdLookupService,
    private readonly productService: GrocyProductService,
    @inject("PromptProvider") private readonly prompt: PromptProvider
  ) {
    super();
  }

  async getParentProducts(products?: Product[]): Promise<Record<string, ParentProduct>> {
    if (!products) {
      products = await this.productService.getAllProducts();
    }
    const productGroupNames = await this.productGroupIdService.getMapOfGrocyIdsToKeys();
    const parents: Record<string, ParentProduct> = Object.fromEntries(
      products
        .filter((product) => product.userfields.isParent)
        .map((product) => {
          const category = productGroupNames[product.product_group_id];
          const tags = product.name.replace("(Generic)", "").trim().split(" ");
          const parent = { product, category, tags, children: [] };
          return [product.id, parent];
        })
    );
    products.forEach((product) => {
      const parent = parents[product.parent_product_id as string];
      if (parent) {
        parent.children.push(product);
      }
    });
    return parents;
  }

  async multiselectChildProducts(parent: ParentProduct): Promise<Product[] | null> {
    return this.prompt.multiselect("Select child products for " + parent.product.name, [
      ...parent.children.map((child) => ({ title: child.name, value: child })),
    ]);
  }

  async promptForMatchingParent(
    name: string,
    category: GrocyProductGroup,
    parents: ParentProduct[]
  ): Promise<ParentProduct | null> {
    const parentMatches = parents.filter(
      (parent) => parent.category === category && parent.tags.some((tag) => name.match(tag))
    );
    if (parentMatches.length === 0) {
      return null;
    }
    return this.prompt.select("Select parent product for " + name, [
      { title: "None", value: null },
      ...parentMatches.map((parent) => ({
        title: parent.product.name,
        value: parent,
      })),
    ]);
  }
}
