import { FOODSTUFFS_CATEGORIES } from "@gt/store/foodstuffs/models";
import { Logger } from "@gt/utils/logger";
import { GrocyProductGroup } from "../grocy-config";
import { GrocyIdLookupService } from "./grocy-id-lookup-service";

export class GrocyProductGroupIdLookupService extends GrocyIdLookupService<GrocyProductGroup> {
  private readonly logger = new Logger(this.constructor.name);
  private readonly foodstuffsCategories = [...FOODSTUFFS_CATEGORIES];

  protected async fetchMapOfKeysToGrocyIds(): Promise<Record<GrocyProductGroup, string>> {
    const productGroups = await this.fetchMapOfEntityKeysToIds<ProductGroup>(
      "product_groups",
      "name"
    );
    const productGroupNames = Object.keys(productGroups);
    const missingProductGroups = this.foodstuffsCategories.filter(
      (name) => !productGroupNames.includes(name)
    );
    if (missingProductGroups.length > 0) {
      const missing = missingProductGroups.join(", ");
      this.logger.warn(`Categories are missing from grocy: '${missing}'`);
      await Promise.all(
        missingProductGroups.map((pg) =>
          this.entityService.postEntityObject("product_groups", {
            body: JSON.stringify({ name: pg, description: "" }),
          })
        )
      );
    }
    return this.fetchMapOfEntityKeysToIds<ProductGroup>(
      "product_groups",
      "name",
      this.foodstuffsCategories
    );
  }
}

interface ProductGroup {
  id: string;
  name: GrocyProductGroup;
  description: string;
}
