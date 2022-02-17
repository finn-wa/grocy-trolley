import { deleteForJson, getForJson, postForJson } from "@grocy-trolley/utils/fetch-utils";
import {
  FoodstuffsAuthService,
  FoodstuffsBaseProduct,
  FoodstuffsCartProduct,
  FoodstuffsStore,
  ListProductRef,
  ProductsSnapshot,
} from ".";
import { FoodstuffsRestService } from "./foodstuffs-rest-service";

export class FoodstuffsCartService extends FoodstuffsRestService {
  constructor(authService: FoodstuffsAuthService) {
    super(authService);
  }

  getCart(): Promise<FoodstuffsCart> {
    return getForJson(this.buildUrl("Cart/Index"), this.authHeaders().acceptJson().build());
  }

  async clearCart(): Promise<{ success: true }> {
    const response: { success: boolean } = await deleteForJson(
      this.buildUrl("Cart/Clear"),
      this.authHeaders().acceptJson().build()
    );
    if (!response.success) {
      throw new Error(`Failed to clear cart: ${response}`);
    }
    return response as { success: true };
  }

  addProductsToCart(products: CartProductRef[]): Promise<FoodstuffsCart> {
    return postForJson(
      this.buildUrl("Cart/Index"),
      this.authHeaders().contentTypeJson().acceptJson().build(),
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

export interface CartProductRef extends ListProductRef {
  restricted: boolean;
}

export function toCartProductRef(product: FoodstuffsBaseProduct): CartProductRef {
  return {
    productId: product.productId,
    quantity: product.quantity,
    restricted: product.restricted,
    saleType: product.sale_type,
  };
}

export function snapshotToCartProductRefs(products: ProductsSnapshot) {
  return [...products.unavailableProducts, ...products.products].map((product) =>
    toCartProductRef(product)
  );
}
