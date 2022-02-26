import { GrocyOrderRecordService, GrocyProductService, StoreMetadata } from "@grocy-trolley/grocy";
import { GrocyFalse } from "@grocy-trolley/grocy/grocy-model";
import { Logger } from "@grocy-trolley/utils/logger";
import prompts from "prompts";
import {
  FoodstuffsBaseProduct,
  FoodstuffsCartProduct,
  FoodstuffsListService,
  toCartProductRef,
} from "..";
import { FoodstuffsCart, FoodstuffsCartService } from "../foodstuffs-cart";
import { FoodstuffsOrderService as FoodstuffsOrderService } from "../foodstuffs-orders";
import { FoodstuffsToGrocyConverter } from "./foodstuffs-converter";

export class FoodstuffsCartImporter {
  private readonly logger = new Logger("FoodstuffsCartImporter");

  constructor(
    private readonly converter: FoodstuffsToGrocyConverter,
    private readonly cartService: FoodstuffsCartService,
    private readonly grocyProductService: GrocyProductService
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
    const existingProducts = await this.grocyProductService.getProducts();

    const importedProducts = existingProducts
      .map((product) => JSON.parse(product.userfields?.storeMetadata) as StoreMetadata)
      .filter((data) => data && data["PAK'n'SAVE"])
      .map((data) => (data["PAK'n'SAVE"] as FoodstuffsCartProduct).productId);
    const productsToImport = [...cart.products, ...cart.unavailableProducts].filter(
      (p) => !importedProducts.includes(p.productId)
    );

    for (const product of productsToImport) {
      const grocyProduct = this.converter.convertProduct(product, cart.store.storeId);
      this.logger.info(`Importing product ${grocyProduct.name}...`);
      await this.grocyProductService.createProduct(grocyProduct);
    }
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
    return response.list as string;
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
