import { NewProduct, ParentProduct, Product } from "grocy";
import { GrocyIdMaps, QuantityUnitName } from "grocy/grocy-config";
import { GrocyFalse, QuantityUnitConversion } from "grocy/grocy-model";
import { StockActionRequestBody } from "grocy/grocy-stock";
import prompts from "prompts";
import { Logger, prettyPrint } from "utils/logger";
import {
  CategoryLocations,
  FoodstuffsCartProduct,
  FoodstuffsCategory,
  FOODSTUFFS_CATEGORIES,
} from "..";
import { FoodstuffsSearchService, ProductResult } from "../foodstuffs-search";
import { FoodstuffsListProduct, FoodstuffsLiveProduct } from "../foodstuffs.model";

export class FoodstuffsToGrocyConverter {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly grocyIdMaps: GrocyIdMaps,
    private readonly foodstuffsSearchService: FoodstuffsSearchService
  ) {}

  async forImport(
    product: FoodstuffsCartProduct,
    storeId: string,
    parent?: ParentProduct
  ): Promise<NewProductPayloads> {
    const purchaseSaleType = this.getPurchaseSaleType(product);
    let purchaseUnitId: number;
    let stockUnitId: number;
    let stockQuantityFactor: number;
    let quantitySuffix: string;
    let quConversions: ConversionWithoutId[] = [];

    if (purchaseSaleType.type === "UNITS") {
      if (!product.weightDisplayName) {
        this.logger.warn(
          'Product has no weightDisplayName, defaulting to "ea": ' + prettyPrint(product)
        );
        product.weightDisplayName = "ea";
      }
      const displayUnit = this.getUnitFromString(product.weightDisplayName);
      const displayUnitId = this.getUnitId(displayUnit);
      // Foodstuffs is inconsistent with capitalisation of units
      quantitySuffix =
        "(" + product.weightDisplayName.replace(new RegExp(displayUnit, "i"), displayUnit) + ")";
      if (displayUnit === "pk") {
        // For packs, we want to buy 1 pack and stock x items
        purchaseUnitId = displayUnitId;
        stockUnitId = this.getUnitId("ea");
        stockQuantityFactor = this.getDisplayQuantityRequired(product.weightDisplayName);
      } else if (displayUnit === "ea") {
        purchaseUnitId = displayUnitId;
        stockUnitId = displayUnitId;
        stockQuantityFactor = 1;
      } else {
        const eaUnitId = this.getUnitId("ea");
        purchaseUnitId = eaUnitId;
        // Unfortunately, grocy tries to store everything as price per stock unit
        // So using grams as a stock unit rarely works (often price is listed as 0.01)
        // We will only do it if there is a configured parent product
        const displayQuantity = this.getDisplayQuantity(product.weightDisplayName) ?? 1;
        if (parent && parent.product.qu_id_stock !== eaUnitId) {
          stockUnitId = displayUnitId;
          stockQuantityFactor = displayQuantity;
        } else {
          stockUnitId = eaUnitId;
          stockQuantityFactor = 1;
        }
        // Otherwise, store weight as a product quantity unit conversion override
        quConversions = this.getProductQuantityUnitConversions(displayUnit, displayQuantity);
      }
    } else if (purchaseSaleType.type === "WEIGHT") {
      const purchaseUnit = this.grocyIdMaps.matchQuantityUnit(purchaseSaleType.unit);
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

    const newProduct = {
      name: [product.brand, product.name, quantitySuffix].filter((x) => !!x).join(" "),
      parent_product_id: parent?.product.id,
      description: "",
      location_id: this.categoryToLocationId(product.categoryName),
      qu_id_purchase: purchaseUnitId,
      qu_id_stock: stockUnitId,
      qu_factor_purchase_to_stock: stockQuantityFactor,
      quick_consume_amount: stockQuantityFactor,
      product_group_id: this.categoryToProductGroupId(product.categoryName),
      shopping_location_id: this.getShoppingLocationId(storeId),
      userfields: { storeMetadata: JSON.stringify({ PNS: product }), isParent: GrocyFalse },
    };
    return { product: newProduct, quConversions };
  }

  async forImportListProduct(
    product: FoodstuffsListProduct,
    parent?: ParentProduct
  ): Promise<NewProductPayloads> {
    const purchaseSaleType = this.getPurchaseSaleType(product);
    let purchaseUnitId: number;
    let stockUnitId: number;
    let stockQuantityFactor: number;
    let quantitySuffix: string;
    let quConversions: ConversionWithoutId[] = [];

    const searchResults = await this.foodstuffsSearchService.searchProducts(product.productId);
    const searchProduct: ProductResult | undefined = searchResults[0];

    if (purchaseSaleType.type === "UNITS") {
      const weightDisplayName = searchProduct?.ProductWeightDisplayName ?? "ea";
      const displayUnit = this.getUnitFromString(weightDisplayName);
      const displayUnitId = this.getUnitId(displayUnit);
      // Foodstuffs is inconsistent with capitalisation of units
      quantitySuffix =
        "(" + weightDisplayName.replace(new RegExp(displayUnit, "i"), displayUnit) + ")";
      if (displayUnit === "pk") {
        // For packs, we want to buy 1 pack and stock x items
        purchaseUnitId = displayUnitId;
        stockUnitId = this.getUnitId("ea");
        stockQuantityFactor = this.getDisplayQuantityRequired(weightDisplayName);
      } else if (displayUnit === "ea") {
        purchaseUnitId = displayUnitId;
        stockUnitId = displayUnitId;
        stockQuantityFactor = 1;
      } else {
        const eaUnitId = this.getUnitId("ea");
        purchaseUnitId = eaUnitId;
        // Unfortunately, grocy tries to store everything as price per stock unit
        // So using grams as a stock unit rarely works (often price is listed as 0.01)
        // We will only do it if there is a configured parent product
        const displayQuantity = this.getDisplayQuantity(weightDisplayName) ?? 1;
        if (parent && parent.product.qu_id_stock !== eaUnitId) {
          stockUnitId = displayUnitId;
          stockQuantityFactor = displayQuantity;
        } else {
          stockUnitId = eaUnitId;
          stockQuantityFactor = 1;
        }
        // Otherwise, store weight as a product quantity unit conversion override
        quConversions = this.getProductQuantityUnitConversions(displayUnit, displayQuantity);
      }
    } else if (purchaseSaleType.type === "WEIGHT") {
      const purchaseUnit = this.grocyIdMaps.matchQuantityUnit(purchaseSaleType.unit);
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

    const newProduct = {
      name: [searchProduct?.ProductBrand, product.name, quantitySuffix]
        .filter((x) => !!x)
        .join(" "),
      parent_product_id: parent?.product.id,
      description: "",
      location_id: this.categoryToLocationId(product.category),
      qu_id_purchase: purchaseUnitId,
      qu_id_stock: stockUnitId,
      qu_factor_purchase_to_stock: stockQuantityFactor,
      quick_consume_amount: stockQuantityFactor,
      product_group_id: this.categoryToProductGroupId(product.category),
      userfields: { storeMetadata: JSON.stringify({ PNS: product }), isParent: GrocyFalse },
    };
    return { product: newProduct, quConversions };
  }

  forAddStock(product: Product, storeId = "paknsave-list"): StockActionRequestBody<"add"> {
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

  private getProductQuantityUnitConversions(
    displayUnit: "g" | "kg" | "mL" | "L",
    displayWeight: number
  ): ConversionWithoutId[] {
    // Use larger units if small units will cause a loss in accuracy
    // e.g. factor for 950g product, ea -> g: 0.0011 (4 dp), comes out to 1 ea == 909g
    // but if you use kg: ea -> kg = 0.9500, comes out to 1 ea == 950g.
    if (displayWeight > 100) {
      if (displayUnit === "g") {
        displayUnit = "kg";
        displayWeight /= 1000;
      } else if (displayUnit === "mL") {
        displayUnit = "L";
        displayWeight /= 1000;
      }
    }
    const eaUnitId = this.getUnitId("ea");
    const displayUnitId = this.getUnitId(displayUnit);
    return [
      {
        from_qu_id: eaUnitId,
        to_qu_id: displayUnitId,
        factor: displayWeight,
      },
      {
        from_qu_id: displayUnitId,
        to_qu_id: eaUnitId,
        factor: 1 / displayWeight,
      },
    ];
  }

  private getPurchaseSaleType(product: FoodstuffsLiveProduct) {
    const saleType = product.sale_type === "BOTH" ? "WEIGHT" : product.sale_type;
    const purchaseSaleType = product.saleTypes.find((x) => x.type === saleType);
    if (!purchaseSaleType?.unit) {
      throw new Error(`Unit mismatch in ${prettyPrint(product)}`);
    }
    return purchaseSaleType;
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
    return this.grocyIdMaps.matchQuantityUnit(unit[0]);
  }

  private getUnitId(unit: string): number {
    const resolvedUnit = this.grocyIdMaps.matchQuantityUnit(unit);
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

export type ConversionWithoutId = Pick<
  QuantityUnitConversion,
  "from_qu_id" | "to_qu_id" | "factor"
>;
export interface NewProductPayloads {
  product: NewProduct;
  quConversions: ConversionWithoutId[];
}
