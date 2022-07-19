import { Logger } from "@gt/utils/logger";
import prompts from "prompts";
import { GrocyProductGroup } from "../grocy-config";
import { GrocyProductGroupIdLookupService } from "../id-lookup/grocy-product-group-id-lookup-service";
import { GrocyProductService } from "./grocy-product-service";
import { Product } from "./types/Product";
import { GrocyRestService } from "../rest/grocy-rest-service";
import { ParentProduct } from "./types";

export class GrocyParentProductService extends GrocyRestService {
  protected readonly logger = new Logger(this.constructor.name);
  private parentProducts: Record<string, ParentProduct> | null = null;

  constructor(
    private readonly productGroupIdService: GrocyProductGroupIdLookupService,
    private readonly productService: GrocyProductService
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

  async promptForChild(parent: ParentProduct): Promise<Product | null> {
    const choice = await prompts({
      message: "Select child product for " + parent.product.name,
      name: "value",
      type: "select",
      choices: [
        ...parent.children.map((child) => ({ title: child.name, value: child })),
        { title: "Exit", value: null },
      ],
    });
    return choice.value as Product | null;
  }

  async promptForMatchingParent(
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
          ...parentMatches.map((parent) => ({
            title: parent.product.name,
            value: parent,
          })),
        ],
      },
    ]);
    return chosenParent.value as ParentProduct | undefined;
  }
}
