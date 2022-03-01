import { BarcodeBuddyScraper } from "@grocy-trolley/barcodebuddy/scraper";
import {
  GrocyOrderRecordService,
  GrocyProductService,
  SerializedProduct,
} from "@grocy-trolley/grocy";
import { GrocyFalse, GrocyTrue } from "@grocy-trolley/grocy/grocy-model";
import { GrocyStockService } from "@grocy-trolley/grocy/grocy-stock";
import { Logger } from "@grocy-trolley/utils/logger";
import prompts, { prompt } from "prompts";
import {
  CartProductRef,
  FoodstuffsBaseProduct,
  FoodstuffsCartProduct,
  FoodstuffsListService,
  FoodstuffsSearchService,
  ProductResult,
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
    private readonly grocyProductService: GrocyProductService,
    private readonly grocyStockService: GrocyStockService
  ) {}

  async importProducts(products: FoodstuffsBaseProduct[]) {
    const productRefs = products.map((product) => toCartProductRef(product));
    return this.importProductRefs(productRefs);
  }

  async importProductRefs(productRefs: CartProductRef[]) {
    await this.cartService.clearCart();
    const cart = await this.cartService.addProductsToCart(productRefs);
    await this.importProductsFromCart(cart);
  }

  async importProductsFromCart(cart?: FoodstuffsCart): Promise<void> {
    if (!cart) {
      cart = await this.cartService.getCart();
    }
    const existingProducts = await this.grocyProductService.getProductsWithParsedUserfields();
    const existingProductIds = existingProducts
      .filter((p) => p.userfields?.storeMetadata?.PNS)
      .map((product) => product.userfields.storeMetadata.PNS?.productId);

    const productsToImport = [...cart.products, ...cart.unavailableProducts].filter(
      (p) => !existingProductIds.includes(p.productId)
    );
    const parentProducts = await this.grocyProductService.getParentProducts();
    let newProducts: { id: string; product: FoodstuffsCartProduct }[] = [];

    for (const product of productsToImport) {
      const grocyProduct = await this.converter.forImport(
        product,
        cart.store.storeId,
        parentProducts
      );
      this.logger.info(`Importing product ${grocyProduct.name}...`);
      const createdProduct = await this.grocyProductService.createProduct(grocyProduct);
      newProducts.push({ id: createdProduct.objectId, product });
    }
    const stock: { value: boolean } = await prompt({
      name: "value",
      message: "Stock imported products?",
      type: "confirm",
    });
    if (stock.value) {
      await this.stockProductsFromCart(cart);
    }
  }

  async stockProductsFromCart(cart?: FoodstuffsCart) {
    if (!cart) {
      cart = await this.cartService.getCart();
    }
    const existingProducts = await this.grocyProductService.getProductsWithParsedUserfields();
    const productsByPnsId: Record<string, SerializedProduct> = Object.fromEntries(
      existingProducts
        .filter((p) => p.userfields?.storeMetadata?.PNS)
        .map((product) => [product.userfields.storeMetadata.PNS?.productId, product])
    );
    // Not including unavailable products for stock
    for (const product of cart.products) {
      const grocyProduct = productsByPnsId[product.productId];
      if (!grocyProduct) {
        this.logger.error(
          `Product ${product.productId} (${product.name}) does not exist in Grocy, skipping`
        );
        continue;
      }
      await this.grocyStockService.stock(
        "add",
        grocyProduct.id,
        this.converter.forAddStock(grocyProduct, cart.store.storeId)
      );
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
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly cartImporter: FoodstuffsCartImporter,
    private readonly orderService: FoodstuffsOrderService,
    private readonly orderRecordService: GrocyOrderRecordService
  ) {}

  async getUnimportedOrderNumbers(): Promise<string[]> {
    const foodstuffsOrderIds = (await this.orderService.getOrders()).map(
      (order) => order.orderNumber
    );
    const grocyOrderRecords = await this.orderRecordService.getOrderRecords();
    const importedOrderIds = grocyOrderRecords
      .filter((record) => record.imported === GrocyTrue)
      .map((record) => record.orderId);
    return foodstuffsOrderIds.filter((id) => !importedOrderIds.includes(id));
  }

  async importOrder(orderNumber: string): Promise<void> {
    this.logger.info("Importing order " + orderNumber);
    const order = await this.orderService.getOrderDetails(orderNumber);
    const record = await this.orderRecordService.createOrderRecord({
      brand: "PNS",
      date: order.summary.timeslot.date,
      orderId: orderNumber,
      imported: GrocyFalse,
    });
    await this.cartImporter.importProducts([...order.unavailableProducts, ...order.products]);
    await this.orderRecordService.markOrderAsImported(record.objectId);
  }

  async importLatestOrders(): Promise<void> {
    const unimportedOrderNumbers = await this.getUnimportedOrderNumbers();
    this.logger.info("Found unimported orders: " + unimportedOrderNumbers);
    for (const id of unimportedOrderNumbers) {
      await this.importOrder(id);
    }
  }
}

export class FoodstuffsBarcodesImporter {
  constructor(
    private readonly bbScraper: BarcodeBuddyScraper,
    private readonly productService: GrocyProductService,
    private readonly searchService: FoodstuffsSearchService,
    private readonly cartImporter: FoodstuffsCartImporter
  ) {}

  async importFromBarcodeBuddy() {
    const barcodes = await this.bbScraper.getBarcodes();
    const cartRefs: Record<string, CartProductRef> = {};
    for (const barcode of barcodes) {
      const results = await this.searchService.searchProducts(barcode);
      let product: ProductResult;
      if (results.length === 0) {
        continue;
      }
      if (results.length === 1) {
        product = results[0];
        console.log(this.getTitle(product));
      } else {
        const choice = await prompts([
          {
            message: "Results",
            name: "value",
            type: "select",
            choices: [
              { title: "Skip" },
              ...results.map((r) => ({
                title: `${r.ProductBrand} ${r.ProductName} ${r.ProductWeightDisplayName}`,
                value: r,
              })),
            ],
          },
        ]);
        if (!choice.value) {
          continue;
        }
        product = choice.value as ProductResult;
      }
      cartRefs[barcode] = this.toCartRef(product);
    }
    const importProducts = await prompts([
      {
        message: "Import products?",
        name: "value",
        type: "confirm",
      },
    ]);
    if (!importProducts.value) {
      return;
    }
    await this.cartImporter.importProductRefs(Object.values(cartRefs));
    for (const [barcode, ref] of Object.entries(cartRefs)) {
      const existing = await this.productService.getProduct(ref.productId);
      existing.barcode = barcode;
      await this.productService.updateProduct(existing);
    }
  }

  getTitle(res: ProductResult): string {
    return `${res.ProductBrand} ${res.ProductName} ${res.ProductWeightDisplayName}`;
  }

  toCartRef(product: ProductResult): CartProductRef {
    return {
      productId: product.ProductId,
      restricted: product.Restricted,
      sale_type: product.SaleType,
      quantity: 1,
    };
  }
}
