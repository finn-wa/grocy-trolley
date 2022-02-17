import { GrocyOrderRecordService, GrocyProductService, NewProduct } from "@grocy-trolley/grocy";
import {
  GrocyIdMaps,
  GrocyLocation,
  GrocyProductGroup,
  QuantityUnitName,
  QUANTITY_UNITS,
  StoreBrand,
} from "@grocy-trolley/grocy/grocy-config";
import { prettyPrint } from "@grocy-trolley/utils/logging-utils";
import {
  CategoryLocations,
  FoodstuffsCartProduct,
  FoodstuffsCategory,
  FoodstuffsListService,
  FOODSTUFFS_CATEGORIES,
} from ".";
import {
  FoodstuffsCart,
  FoodstuffsCartService,
  snapshotToCartProductRefs,
} from "./foodstuffs-cart";
import { FoodstuffsOrderService as FoodstuffsOrderService } from "./foodstuffs-orders";

export class FoodstuffsToGrocyService {
  constructor(
    private readonly cartService: FoodstuffsCartService,
    private readonly listService: FoodstuffsListService,
    private readonly orderService: FoodstuffsOrderService,
    private readonly grocyProductService: GrocyProductService,
    private readonly orderRecordService: GrocyOrderRecordService,
    private readonly grocyIdMaps: GrocyIdMaps
  ) {}

  async importProductsFromOrders(): Promise<void> {
    const orders = await this.orderService.getOrders();
    const orderRecords = await this.orderRecordService.getOrderRecords();
    const importedOrderIds = orderRecords
      .filter((record) => record.imported)
      .map((record) => record.orderId);
    for (const order of orders) {
      if (!importedOrderIds.includes(order.orderNumber)) {
        await this.importProductsFromOrder(order.orderNumber);
      }
    }
  }

  async importProductsFromOrder(orderNumber: string): Promise<void> {
    const order = await this.orderService.getOrderDetails(orderNumber);
    const products = snapshotToCartProductRefs(order);
    await this.cartService.clearCart();
    const cart = await this.cartService.addProductsToCart(products);
    return this.importProductsFromCart(cart);
  }

  async importProductsFromCart(cart?: FoodstuffsCart): Promise<void> {
    if (!cart) {
      cart = await this.cartService.getCart();
    }
    const shoppingLocationId = this.getShoppingLocationId(cart.store.storeId);
    const existingProducts = await this.grocyProductService.getProducts();
    const importedProducts = existingProducts
      .map((product) => JSON.parse(product.userfields?.storeMetadata as string))
      .filter((data) => "PAK'n'SAVE" in data)
      .map((data) => (data["PAK'n'SAVE"] as FoodstuffsCartProduct).productId);
    const productsToImport = [...cart.products, ...cart.unavailableProducts].filter(
      (p) => !importedProducts.includes(p.productId)
    );

    for (const product of productsToImport) {
      const grocyProduct = this.convertProduct(product, shoppingLocationId);
      console.log(`Importing product ${grocyProduct.name}...`);
      await this.grocyProductService.createProduct(grocyProduct);
    }
  }

  convertProduct(source: FoodstuffsCartProduct, shoppingLocationId?: number): NewProduct {
    const locationId = this.categoryToLocationId(source.categoryName);
    const stockUnitId = this.getUnitIdFromString(source.weightDisplayName);
    const stockWeight = this.getWeightFromString(source.weightDisplayName);
    const purchaseUnit = source.saleTypes.find((x) => x.type === source.sale_type)?.unit;
    if (!purchaseUnit) {
      throw new Error(`Unit mismatch in ${prettyPrint(source)}`);
    }
    const purchaseUnitId = this.getUnitId(purchaseUnit);
    const productGroupId = this.categoryToProductGroupId(source.categoryName);
    return {
      name: `${source.brand} ${source.name}`,
      description: "",
      location_id: locationId,
      qu_id_purchase: purchaseUnitId,
      qu_id_stock: stockUnitId,
      qu_factor_purchase_to_stock: stockWeight,
      product_group_id: productGroupId,
      shopping_location_id: shoppingLocationId,
      userfields: { storeMetadata: JSON.stringify({ "PAK'n'SAVE": source }) },
    };
  }

  private buildUserfields(storeMetadata: Partial<Record<StoreBrand, any>>): {
    storeMetadata: string;
  } {
    return { storeMetadata: JSON.stringify(storeMetadata) };
  }

  private getWeightFromString(weightDisplayName: string): number {
    const weight = weightDisplayName.match(/[\d\.]+/);
    if (weight === null) {
      console.error(`Failed to get weight from "${weightDisplayName}"`);
      return 1;
    }
    return Number.parseFloat(weight[0]);
  }

  private getUnitIdFromString(weightDisplayName: string): number {
    const unit = weightDisplayName.match(/[a-zA-Z]+/);
    if (!unit) {
      throw new Error(`Failed to find unit in "${weightDisplayName}"`);
    }
    return this.getUnitId(unit[0]);
  }

  private getUnitId(unit: string): number {
    if (!QUANTITY_UNITS.includes(unit as QuantityUnitName)) {
      throw new Error("Unmapped unit: " + unit);
    }
    return this.grocyIdMaps.quantityUnitIds[unit as QuantityUnitName];
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
