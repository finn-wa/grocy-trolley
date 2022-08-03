import { QuantityUnitName } from "@gt/grocy/grocy-config";
import { GrocyLocationIdLookupService } from "@gt/grocy/id-lookup/grocy-location-id-lookup-service";
import { GrocyProductGroupIdLookupService } from "@gt/grocy/id-lookup/grocy-product-group-id-lookup-service";
import { GrocyQuantityUnitIdLookupService } from "@gt/grocy/id-lookup/grocy-quantity-unit-id-lookup-service";
import { GrocyShoppingLocationIdLookupService } from "@gt/grocy/id-lookup/grocy-shopping-location-id-lookup-service";
import { ParentProduct } from "@gt/grocy/products/types";
import { NewProduct, Product } from "@gt/grocy/products/types/Product";
import { StockAddRequest } from "@gt/grocy/stock/types";
import { QuantityUnitConversion } from "@gt/grocy/types/grocy-types";
import { Logger, prettyPrint } from "@gt/utils/logger";
import { singleton } from "tsyringe";
import { FoodstuffsCartProduct, FoodstuffsListProduct, FoodstuffsLiveProduct } from "../../models";
import { FoodstuffsSearchService } from "../../search/foodstuffs-search-service";
import { CategoryLocations } from "../categories";

@singleton()
export class FoodstuffsToGrocyConverter {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly foodstuffsSearchService: FoodstuffsSearchService,
    private readonly grocyLocationIds: GrocyLocationIdLookupService,
    private readonly grocyQuantityUnitIds: GrocyQuantityUnitIdLookupService,
    private readonly grocyProductGroupIds: GrocyProductGroupIdLookupService,
    private readonly grocyShoppingLocationIds: GrocyShoppingLocationIdLookupService
  ) {}

  async forImport(
    product: FoodstuffsCartProduct,
    storeId: string,
    parent?: ParentProduct
  ): Promise<NewProductPayloads> {
    const purchaseSaleType = this.getPurchaseSaleType(product);
    let purchaseUnitId: string;
    let stockUnitId: string;
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
      const displayUnitId = await this.getUnitId(displayUnit);
      // Foodstuffs is inconsistent with capitalisation of units
      quantitySuffix =
        "(" + product.weightDisplayName.replace(new RegExp(displayUnit, "i"), displayUnit) + ")";
      if (displayUnit === "pk") {
        // For packs, we want to buy 1 pack and stock x items
        purchaseUnitId = displayUnitId;
        stockUnitId = await this.getUnitId("ea");
        stockQuantityFactor = this.getDisplayQuantityRequired(product.weightDisplayName);
      } else if (displayUnit === "ea") {
        purchaseUnitId = displayUnitId;
        stockUnitId = displayUnitId;
        stockQuantityFactor = 1;
      } else {
        const eaUnitId = await this.getUnitId("ea");
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
        quConversions = await this.getProductQuantityUnitConversions(displayUnit, displayQuantity);
      }
    } else if (purchaseSaleType.type === "WEIGHT") {
      const purchaseUnit = this.grocyQuantityUnitIds.matchQuantityUnit(purchaseSaleType.unit);
      // weightDisplayName is often wrong for WEIGHT saleType
      quantitySuffix = `(${purchaseUnit})`;
      purchaseUnitId = await this.getUnitId(purchaseUnit);
      stockUnitId = purchaseUnitId;
      stockQuantityFactor = 1;
    } else {
      throw new Error("Unexpected saleType: " + purchaseSaleType.type);
    }
    if (parent?.product?.qu_id_stock && parent.product.qu_id_stock !== stockUnitId) {
      const parentStockUnit = await this.grocyQuantityUnitIds.getKey(parent.product.qu_id_stock);
      const childStockUnit = await this.grocyQuantityUnitIds.getKey(stockUnitId);
      this.logger.error(
        `Parent stock unit ${parentStockUnit} does not match ${childStockUnit}! Please fix in Grocy.`
      );
    }

    const category = product.categoryName;
    const newProduct = {
      name: [product.brand, product.name, quantitySuffix].filter((x) => !!x).join(" "),
      parent_product_id: parent?.product.id,
      description: "",
      location_id: await this.grocyLocationIds.getRequiredGrocyId(CategoryLocations[category]),
      qu_id_purchase: purchaseUnitId,
      qu_id_stock: stockUnitId,
      qu_factor_purchase_to_stock: stockQuantityFactor,
      quick_consume_amount: stockQuantityFactor,
      product_group_id: await this.grocyProductGroupIds.getGrocyId(category),
      shopping_location_id: await this.grocyShoppingLocationIds.getGrocyId(storeId),
      userfields: { storeMetadata: { PNS: product }, isParent: false },
    };
    return { product: newProduct, quConversions };
  }

  async forImportListProduct(
    product: FoodstuffsListProduct,
    parent?: ParentProduct
  ): Promise<NewProductPayloads> {
    const purchaseSaleType = this.getPurchaseSaleType(product);
    let purchaseUnitId: string;
    let stockUnitId: string;
    let stockQuantityFactor: number;
    let quantitySuffix: string;
    let quConversions: ConversionWithoutId[] = [];

    const searchProduct = await this.foodstuffsSearchService.searchAndSelectProduct(
      product.productId
    );

    if (purchaseSaleType.type === "UNITS") {
      const weightDisplayName = searchProduct?.ProductWeightDisplayName ?? "ea";
      const displayUnit = this.getUnitFromString(weightDisplayName);
      const displayUnitId = await this.getUnitId(displayUnit);
      // Foodstuffs is inconsistent with capitalisation of units
      quantitySuffix =
        "(" + weightDisplayName.replace(new RegExp(displayUnit, "i"), displayUnit) + ")";
      if (displayUnit === "pk") {
        // For packs, we want to buy 1 pack and stock x items
        purchaseUnitId = displayUnitId;
        stockUnitId = await this.getUnitId("ea");
        stockQuantityFactor = this.getDisplayQuantityRequired(weightDisplayName);
      } else if (displayUnit === "ea") {
        purchaseUnitId = displayUnitId;
        stockUnitId = displayUnitId;
        stockQuantityFactor = 1;
      } else {
        const eaUnitId = await this.getUnitId("ea");
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
        quConversions = await this.getProductQuantityUnitConversions(displayUnit, displayQuantity);
      }
    } else if (purchaseSaleType.type === "WEIGHT") {
      const purchaseUnit = this.grocyQuantityUnitIds.matchQuantityUnit(purchaseSaleType.unit);
      // weightDisplayName is often wrong for WEIGHT saleType
      quantitySuffix = `(${purchaseUnit})`;
      purchaseUnitId = await this.getUnitId(purchaseUnit);
      stockUnitId = purchaseUnitId;
      stockQuantityFactor = 1;
    } else {
      throw new Error("Unexpected saleType: " + purchaseSaleType.type);
    }
    if (parent?.product?.qu_id_stock && parent.product.qu_id_stock !== stockUnitId) {
      const parentStockUnit = await this.grocyQuantityUnitIds.getKey(parent.product.qu_id_stock);
      const childStockUnit = await this.grocyQuantityUnitIds.getKey(stockUnitId);
      this.logger.error(
        `Parent stock unit ${parentStockUnit} does not match ${childStockUnit}! Please fix in Grocy.`
      );
    }

    const newProduct = {
      name: [searchProduct?.ProductBrand, product.name, quantitySuffix]
        .filter((x) => !!x)
        .join(" "),
      parent_product_id: parent?.product?.id,
      description: "",
      location_id: await this.grocyLocationIds.getRequiredGrocyId(
        CategoryLocations[product.category]
      ),
      qu_id_purchase: purchaseUnitId,
      qu_id_stock: stockUnitId,
      qu_factor_purchase_to_stock: stockQuantityFactor,
      quick_consume_amount: stockQuantityFactor,
      product_group_id: await this.grocyProductGroupIds.getGrocyId(product.category),
      userfields: { storeMetadata: { PNS: product }, isParent: false },
    };
    return { product: newProduct, quConversions };
  }

  async forAddStock(product: Product, storeId = "paknsave-list"): Promise<StockAddRequest> {
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
    const fsCategory = "category" in fsProduct ? fsProduct.category : fsProduct.categoryName;
    return {
      amount: fsProduct.quantity * quantityFactor,
      price: fsProduct.price / 100 / priceFactor,
      best_before_date: "2999-12-31",
      shopping_location_id: await this.grocyShoppingLocationIds.getRequiredGrocyId(storeId),
      location_id: await this.grocyLocationIds.getRequiredGrocyId(CategoryLocations[fsCategory]),
    };
  }

  private async getProductQuantityUnitConversions(
    displayUnit: "g" | "kg" | "mL" | "L",
    displayWeight: number
  ): Promise<ConversionWithoutId[]> {
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
    const eaUnitId = await this.getUnitId("ea");
    const displayUnitId = await this.getUnitId(displayUnit);
    return [
      {
        from_qu_id: eaUnitId,
        to_qu_id: displayUnitId,
        factor: displayWeight,
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
    return this.grocyQuantityUnitIds.matchQuantityUnit(unit[0]);
  }

  private getUnitId(unit: string): Promise<string> {
    const resolvedUnit = this.grocyQuantityUnitIds.matchQuantityUnit(unit);
    return this.grocyQuantityUnitIds.getRequiredGrocyId(resolvedUnit);
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
