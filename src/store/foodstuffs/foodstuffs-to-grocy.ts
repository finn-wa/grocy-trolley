import {
  GrocyOrderRecordService,
  GrocyProductService,
  matchQuantityUnit,
  NewProduct,
} from "@grocy-trolley/grocy";
import { GrocyIdMaps, QuantityUnitName } from "@grocy-trolley/grocy/grocy-config";
import { GrocyFalse } from "@grocy-trolley/grocy/grocy-model";
import { prettyPrint } from "@grocy-trolley/utils/logging-utils";
import prompts from "prompts";
import {
  CategoryLocations,
  FoodstuffsBaseProduct,
  FoodstuffsCartProduct,
  FoodstuffsCategory,
  FoodstuffsListService,
  FOODSTUFFS_CATEGORIES,
  toCartProductRef,
} from ".";
import { FoodstuffsCart, FoodstuffsCartService } from "./foodstuffs-cart";
import { FoodstuffsOrderService as FoodstuffsOrderService } from "./foodstuffs-orders";

export class FoodstuffsCartImporter {
  constructor(
    private readonly cartService: FoodstuffsCartService,
    private readonly grocyProductService: GrocyProductService,
    private readonly grocyIdMaps: GrocyIdMaps
  ) {}

  async importProducts(products: FoodstuffsBaseProduct[]) {
    const productRefs = products.map((product) => toCartProductRef(product));
    await this.cartService.clearCart();
    const cart = await this.cartService.addProductsToCart(productRefs);
    await this.importProductsFromCart(cart);
  }

  async importProductsFromCart(cart?: FoodstuffsCart): Promise<void> {
    if (!cart) {
      cart = await this.cartService.getCart();
    }
    const shoppingLocationId = this.getShoppingLocationId(cart.store.storeId);
    const existingProducts = await this.grocyProductService.getProducts();
    const importedProducts = existingProducts
      .map((product) => JSON.parse(product.userfields?.storeMetadata as string))
      .filter((data) => data && data["PAK'n'SAVE"])
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

  convertProduct(product: FoodstuffsCartProduct, shoppingLocationId?: number): NewProduct {
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
    const displayQuantity = weightDisplayName.match(/[\d\.]+/);
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

export class FoodstuffsListImporter {
  constructor(
    private readonly cartImporter: FoodstuffsCartImporter,
    private readonly listService: FoodstuffsListService
  ) {}

  async selectAndImportList() {
    const listId = await this.selectList();
    return this.importList(listId);
  }

  async importList(id: string): Promise<void> {
    const list = await this.listService.getList(id);
    await this.cartImporter.importProducts(list.products);
  }

  private async selectList(): Promise<string> {
    const lists = await this.listService.getLists();
    const response = await prompts([
      {
        name: "list",
        message: "Select list",
        type: "select",
        choices: lists.map((list) => ({ title: list.name, value: list.listId })),
      },
    ]);
    return response.list;
  }
}

export class FoodstuffsOrderImporter {
  constructor(
    private readonly cartImporter: FoodstuffsCartImporter,
    private readonly orderService: FoodstuffsOrderService,
    private readonly orderRecordService: GrocyOrderRecordService
  ) {}

  async importLatestOrders(): Promise<void> {
    const orders = await this.orderService.getOrders();
    const orderRecords = await this.orderRecordService.getOrderRecords();
    const importedOrderIds = orderRecords.map((record) => record.orderId);
    for (const order of orders) {
      const orderNumber = order.orderNumber;
      if (!importedOrderIds.includes(orderNumber)) {
        await this.importOrder(orderNumber);
      }
    }
  }

  async importOrder(orderNumber: string): Promise<void> {
    const order = await this.orderService.getOrderDetails(orderNumber);
    const record = await this.orderRecordService.createOrderRecord({
      brand: "PAK'n'SAVE",
      date: order.summary.timeslot.date,
      orderId: orderNumber,
      imported: GrocyFalse,
    });
    await this.cartImporter.importProducts([...order.unavailableProducts, ...order.products]);
    await this.orderRecordService.markOrderAsImported(record.objectId);
  }
}
