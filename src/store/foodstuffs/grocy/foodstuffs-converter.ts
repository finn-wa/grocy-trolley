import { matchQuantityUnit, NewProduct } from "@grocy-trolley/grocy";
import { GrocyIdMaps, QuantityUnitName } from "@grocy-trolley/grocy/grocy-config";
import { Logger, prettyPrint } from "@grocy-trolley/utils/logger";
import {
  CategoryLocations,
  FoodstuffsCartProduct,
  FoodstuffsCategory,
  FOODSTUFFS_CATEGORIES,
} from "..";

export class FoodstuffsToGrocyConverter {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly grocyIdMaps: GrocyIdMaps) {}

  convertProduct(product: FoodstuffsCartProduct, storeId: string): NewProduct {
    const shoppingLocationId = this.getShoppingLocationId(storeId);
    const locationId = this.categoryToLocationId(product.categoryName);
    const productGroupId = this.categoryToProductGroupId(product.categoryName);
    const purchaseSaleType = product.saleTypes.find((x) => x.type === product.sale_type);
    if (!purchaseSaleType?.unit) {
      throw new Error(`Unit mismatch in ${prettyPrint(product)}`);
    }
    const purchaseUnit = matchQuantityUnit(purchaseSaleType.unit);
    let purchaseUnitId: number;
    let stockUnitId: number;
    let stockQuantityFactor: number;
    let quantitySuffix: string;

    if (purchaseSaleType.type === "UNITS") {
      quantitySuffix = `(${product.weightDisplayName})`;
      const displayUnit = this.getUnitFromString(product.weightDisplayName);
      if (displayUnit === "pk") {
        // For packs, we want to buy 1 pack and stock x items
        purchaseUnitId = this.getUnitId("pk");
        stockUnitId = this.getUnitId("ea");
        stockQuantityFactor = this.getDisplayQuantityRequired(product.weightDisplayName);
      } else {
        // For all other cases, we want to buy 1 ea and stock x units
        purchaseUnitId = this.getUnitId(purchaseUnit);
        stockUnitId = this.getUnitId(displayUnit);
        stockQuantityFactor = this.getDisplayQuantity(product.weightDisplayName) ?? 1;
      }
    } else if (purchaseSaleType.type === "WEIGHT") {
      // weightDisplayName is often wrong for WEIGHT saleType
      quantitySuffix = `(${purchaseUnit})`;
      purchaseUnitId = this.getUnitId(purchaseUnit);
      stockUnitId = purchaseUnitId;
      stockQuantityFactor = 1;
    } else {
      throw new Error("Unexpected saleType: " + purchaseSaleType.type);
    }
    return {
      name: [product.brand, product.name, quantitySuffix].filter((x) => !!x).join(" "),
      description: "",
      location_id: locationId,
      qu_id_purchase: purchaseUnitId,
      qu_id_stock: stockUnitId,
      qu_factor_purchase_to_stock: stockQuantityFactor,
      product_group_id: productGroupId,
      shopping_location_id: shoppingLocationId,
      userfields: { storeMetadata: JSON.stringify({ "PAK'n'SAVE": product }) },
    };
  }

  private getDisplayQuantity(weightDisplayName: string): number | null {
    const displayQuantity = weightDisplayName.match(/[\d.]+/);
    if (displayQuantity === null) {
      return null;
    }
    return Number.parseFloat(displayQuantity[0]);
  }

  private getDisplayQuantityRequired(weightDisplayName: string): number {
    const weight = this.getDisplayQuantity(weightDisplayName);
    if (weight === null) {
      throw new Error(`Failed to get weight from "${weightDisplayName}"`);
    }
    return weight;
  }

  private getUnitFromString(weightDisplayName: string): QuantityUnitName {
    const unit = weightDisplayName.match(/[a-zA-Z]+/);
    if (!unit) {
      throw new Error(`Failed to find unit in "${weightDisplayName}"`);
    }
    return matchQuantityUnit(unit[0]);
  }

  private getUnitId(unit: string): number {
    const resolvedUnit = matchQuantityUnit(unit);
    return this.grocyIdMaps.quantityUnitIds[resolvedUnit];
  }

  private categoryToLocationId(fsCategory: FoodstuffsCategory): number {
    if (!FOODSTUFFS_CATEGORIES.includes(fsCategory)) {
      throw new Error("Unmapped FS category: " + fsCategory);
    }
    return this.grocyIdMaps.locationIds[CategoryLocations[fsCategory]];
  }

  private categoryToProductGroupId(fsCategory: FoodstuffsCategory): number {
    if (!FOODSTUFFS_CATEGORIES.includes(fsCategory)) {
      throw new Error("Unmapped FS category: " + fsCategory);
    }
    return this.grocyIdMaps.productGroupIds[fsCategory];
  }

  private getShoppingLocationId(storeId: string): number {
    const shoppingLocationId = this.grocyIdMaps.shoppingLocationIds[storeId];
    if (!shoppingLocationId) {
      throw new Error("Unmapped store ID: " + storeId);
    }
    return shoppingLocationId;
  }
}
