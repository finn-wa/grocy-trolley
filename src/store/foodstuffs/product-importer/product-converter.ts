import {
  matchQuantityUnit,
  NewProduct,
  ParentProduct,
  SerializedProduct,
} from "@grocy-trolley/grocy";
import { GrocyIdMaps, QuantityUnitName } from "@grocy-trolley/grocy/grocy-config";
import { GrocyFalse } from "@grocy-trolley/grocy/grocy-model";
import { StockActionRequestBody } from "@grocy-trolley/grocy/grocy-stock";
import { Logger, prettyPrint } from "@grocy-trolley/utils/logger";
import prompts, { prompt } from "prompts";
import {
  CategoryLocations,
  FoodstuffsCartProduct,
  FoodstuffsCategory,
  FOODSTUFFS_CATEGORIES,
} from "..";

export class FoodstuffsToGrocyConverter {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly grocyIdMaps: GrocyIdMaps) {}

  async forImport(
    product: FoodstuffsCartProduct,
    storeId: string,
    parentProducts: ParentProduct[]
  ): Promise<NewProduct> {
    const shoppingLocationId = this.getShoppingLocationId(storeId);
    const locationId = this.categoryToLocationId(product.categoryName);
    const productGroupId = this.categoryToProductGroupId(product.categoryName);
    const purchaseSaleType = this.getPurchaseSaleType(product);
    const purchaseUnit = matchQuantityUnit(purchaseSaleType.unit);
    const parent = await this.findParent(product, parentProducts);
    let purchaseUnitId: number;
    let stockUnitId: number;
    let stockQuantityFactor: number;
    let quantitySuffix: string;

    if (purchaseSaleType.type === "UNITS") {
      if (!product.weightDisplayName) {
        this.logger.warn(
          'Product has no weightDisplayName, defaulting to "ea": ' + prettyPrint(product)
        );
        product.weightDisplayName = "ea";
      }
      const displayUnit = this.getUnitFromString(product.weightDisplayName);
      // Foodstuffs is inconsistent with capitalisation of units
      quantitySuffix =
        "(" + product.weightDisplayName.replace(new RegExp(displayUnit, "i"), displayUnit) + ")";
      if (displayUnit === "pk") {
        // For packs, we want to buy 1 pack and stock x items
        purchaseUnitId = this.getUnitId("pk");
        stockUnitId = this.getUnitId("ea");
        stockQuantityFactor = this.getDisplayQuantityRequired(product.weightDisplayName);
      } else {
        purchaseUnitId = this.getUnitId("ea");
        // Unfortunately, grocy tries to store everything as price per stock unit
        // So using grams as a stock unit rarely works (often price is listed as 0.01)
        // We will only do it if there is a configured parent product
        if (parent && parent.product.qu_id_stock !== purchaseUnitId) {
          stockUnitId = this.getUnitId(displayUnit);
          stockQuantityFactor = this.getDisplayQuantity(product.weightDisplayName) ?? 1;
        } else {
          stockUnitId = purchaseUnitId;
          stockQuantityFactor = 1;
        }
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
    if (parent?.product?.qu_id_stock && parent.product.qu_id_stock !== stockUnitId) {
      const parentStockUnit = this.grocyIdMaps.quantityUnitNames[parent.product.qu_id_stock];
      const childStockUnit = this.grocyIdMaps.quantityUnitNames[stockUnitId];
      this.logger.error(
        `Parent stock unit ${parentStockUnit} does not match ${childStockUnit}! Please fix in Grocy.`
      );
    }
    return {
      name: [product.brand, product.name, quantitySuffix].filter((x) => !!x).join(" "),
      parent_product_id: parent?.product.id,
      description: "",
      location_id: locationId,
      qu_id_purchase: purchaseUnitId,
      qu_id_stock: stockUnitId,
      qu_factor_purchase_to_stock: stockQuantityFactor,
      quick_consume_amount: stockQuantityFactor,
      product_group_id: productGroupId,
      shopping_location_id: shoppingLocationId,
      userfields: { storeMetadata: JSON.stringify({ PNS: product }), isParent: GrocyFalse },
    };
  }

  forAddStock(product: SerializedProduct, storeId: string): StockActionRequestBody<"add"> {
    const fsProduct = product.userfields.storeMetadata?.PNS;
    if (!fsProduct) {
      throw new Error(
        `Product "${product.name}" has no PNS store metadata:\n${prettyPrint(product)}`
      );
    }
    const saleType = this.getPurchaseSaleType(fsProduct);
    const quantityFactor = product.qu_factor_purchase_to_stock;
    // Grocy takes price as price per unit, and for weight purchases quantityFactor is left at 1
    const priceFactor = saleType.type === "WEIGHT" ? fsProduct.quantity : quantityFactor;
    return {
      amount: fsProduct.quantity * quantityFactor,
      price: fsProduct.price / 100 / priceFactor,
      best_before_date: "2999-12-31",
      shopping_location_id: this.getShoppingLocationId(storeId),
      location_id: this.categoryToLocationId(fsProduct.categoryName),
    };
  }

  private getPurchaseSaleType(product: FoodstuffsCartProduct) {
    const purchaseSaleType = product.saleTypes.find((x) => x.type === product.sale_type);
    if (!purchaseSaleType?.unit) {
      throw new Error(`Unit mismatch in ${prettyPrint(product)}`);
    }
    return purchaseSaleType;
  }

  private async findParent(
    product: FoodstuffsCartProduct,
    parents: ParentProduct[]
  ): Promise<ParentProduct | null> {
    const parentMatches = parents.filter(
      (parent) =>
        parent.category === product.categoryName &&
        parent.tags.some((tag) => product.name.match(tag))
    );
    if (parentMatches.length === 0) {
      return null;
    }
    const chosenParent = await prompts([
      {
        message: "Select parent product for " + product.name,
        name: "value",
        type: "select",
        choices: [
          { title: "None", value: null },
          ...(parentMatches.map((parent) => ({
            title: parent.product.name,
            value: parent,
          })) as any), // Values are meant to be strings only, but fuck it
        ],
      },
    ]);
    return chosenParent.value as ParentProduct | null;
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
