import { GrocyIdMaps } from "grocy";
import prompts from "prompts";
import { Logger } from "@gt/utils/logger";
import { toBoolean } from "./grocy-model";
import { GrocyRestService } from "./grocy-rest-service";
import { GrocyProductService, Product } from "./grocy-products";
import { GrocyProductGroup } from "./grocy-config";

export class GrocyParentProductService extends GrocyRestService {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly idMaps: GrocyIdMaps,
    private readonly productService: GrocyProductService
  ) {
    super();
  }

  async getParentProducts(products?: Product[]): Promise<Record<string, ParentProduct>> {
    if (!products) {
      products = await this.productService.getProducts();
    }
    const parents: Record<string, ParentProduct> = Object.fromEntries(
      products
        .filter((product) => toBoolean(product.userfields.isParent))
        .map((product) => {
          const category = this.idMaps.productGroupNames[product.product_group_id];
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

  async findParent(
    name: string,
    category: GrocyProductGroup,
    parents: ParentProduct[]
  ): Promise<ParentProduct | undefined> {
    const parentMatches = parents.filter(
      (parent) => parent.category === category && parent.tags.some((tag) => name.match(tag))
    );
    if (parentMatches.length === 0) {
      return undefined;
    }
    const chosenParent = await prompts([
      {
        message: "Select parent product for " + name,
        name: "value",
        type: "select",
        choices: [
          { title: "None", value: undefined },
          ...(parentMatches.map((parent) => ({
            title: parent.product.name,
            value: parent,
          })) as any), // Values are meant to be strings only, but fuck it
        ],
      },
    ]);
    return chosenParent.value as ParentProduct | undefined;
  }
}

export interface ParentProduct {
  tags: string[];
  category: GrocyProductGroup;
  product: Product;
  children: Product[];
}
