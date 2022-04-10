import { headers } from "utils/headers-builder";
import prompts from "prompts";
import { Logger, prettyPrint } from "utils/logger";
import {
  FoodstuffsUserAgent,
  FoodstuffsBaseProduct,
  FoodstuffsCartProduct,
  FoodstuffsStore,
  ProductsSnapshot,
  SaleTypeString,
} from ".";
import { FoodstuffsRestService } from "./foodstuffs-rest-service";

export class FoodstuffsCartService extends FoodstuffsRestService {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(userAgent: FoodstuffsUserAgent) {
    super(userAgent);
  }

  getCart(): Promise<FoodstuffsCart> {
    return this.getForJson(this.buildUrl("Cart/Index"), headers().acceptJson().build());
  }

  async clearCart(): Promise<{ success: true }> {
    const response = await this.deleteForJson<{ success: boolean }>(
      this.buildUrl("Cart/Clear"),
      headers().acceptJson().build()
    );
    if (!response.success) {
      throw new Error(`Failed to clear cart: ${response}`);
    }
    return response as { success: true };
  }

  async addProductsToCart(products: CartProductRef[]): Promise<FoodstuffsCart> {
    try {
      const cart = await this.postProducts(products);
      return cart;
    } catch (error) {
      this.logger.error(error);
      this.logger.error("Failed to add products to cart. Falling back to chunks.");
    }
    const iter = products[Symbol.iterator]();
    let chunk: CartProductRef[];
    do {
      chunk = Array.from({ length: 5 }, () => iter.next().value).filter((p) => !!p);
      try {
        await this.postProducts(chunk);
      } catch (error) {
        await this.addProductsToCartIndividually(chunk);
      }
    } while (chunk.length === 5);
    return this.getCart();
  }

  private async addProductsToCartIndividually(products: CartProductRef[]): Promise<FoodstuffsCart> {
    for (const product of products) {
      this.logger.debug("Adding product " + product.productId);
      try {
        await this.postProducts([product]);
      } catch (error) {
        this.logger.error("Failed to add product to cart!\n" + prettyPrint(product));
        this.logger.error(error);
        const response = await prompts([
          { name: "resume", type: "confirm", message: "Resume adding products?" },
        ]);
        if (!response.resume) {
          throw error;
        }
      }
    }
    return this.getCart();
  }

  private async postProducts(products: CartProductRef[]): Promise<FoodstuffsCart> {
    return this.postForJson(
      this.buildUrl("Cart/Index"),
      headers().contentTypeJson().acceptJson().build(),
      { products }
    );
  }
}

export interface FoodstuffsCart {
  products: FoodstuffsCartProduct[];
  unavailableProducts: FoodstuffsCartProduct[];
  subtotal: number;
  promoCodeDiscount: number;
  saving: number;
  serviceFee: number;
  bagFee: number;
  store: FoodstuffsStore;
  orderNumber: number;
  allowSubstitutions: boolean;
  wasRepriced: boolean;
}

export function getCartTitle(cart: FoodstuffsCart): string {
  const now = new Date();
  const date = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  const numItems = cart.products.length + cart.unavailableProducts.length;
  return `Cart | ${date} | ${numItems} item${numItems === 1 ? "" : "s"}`;
}

export interface CartProductRef {
  productId: string;
  quantity: number;
  sale_type: SaleTypeString;
  restricted: boolean;
}

export function toCartProductRef(product: FoodstuffsBaseProduct): CartProductRef {
  return {
    productId: product.productId,
    quantity: product.quantity,
    restricted: product.restricted,
    sale_type: product.sale_type,
  };
}

export function snapshotToCartProductRefs(products: ProductsSnapshot) {
  return [...products.unavailableProducts, ...products.products].map((product) =>
    toCartProductRef(product)
  );
}
