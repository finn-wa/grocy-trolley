import { LoginDetails } from "@gt/store/shared/rest/login-details.model";
import { getEnvAs, initEnv } from "@gt/utils/environment";
import { FoodstuffsUserAgent } from "../rest/foodstuffs-user-agent";
import { getBrowser } from "../services";
import { FoodstuffsCartService } from "./foodstuffs-cart-service";
import { CartProductRef, FoodstuffsCart } from "./foodstuffs-cart.model";

describe("FoodstuffsCartService", () => {
  let cartService: FoodstuffsCartService;

  initEnv({
    envFilePath: ".test.env",
    envFilePathOptional: true,
    requiredVars: ["PAKNSAVE_EMAIL", "PAKNSAVE_PASSWORD"],
  });
  const loginDetails: LoginDetails = getEnvAs({
    PAKNSAVE_EMAIL: "email",
    PAKNSAVE_PASSWORD: "password",
  });
  const milk: CartProductRef = {
    productId: "5201479-EA-000",
    quantity: 1,
    sale_type: "UNITS",
  };
  const carrots: CartProductRef = {
    productId: "5039965-KGM-000",
    quantity: 500,
    sale_type: "WEIGHT",
  };

  beforeEach(async () => {
    const userAgent = new FoodstuffsUserAgent(getBrowser, loginDetails);
    cartService = new FoodstuffsCartService(userAgent);
    await cartService.clearCart();
  });

  describe("unit tests", () => {
    test("getCart", async () => {
      const cart = await cartService.getCart();
      expect(cart).toBeTruthy();
      expect(cart).toHaveProperty("products");
      expect(Array.isArray(cart.products)).toBe(true);
    });

    test("addProductsToCart", async () => {
      const emptyCart = await cartService.getCart();
      expect(emptyCart.products.length).toBe(0);

      const products = [milk, carrots];
      const fullCart = await cartService.addProductsToCart(products);

      expect(fullCart.products.length).toEqual(2);
      const productIdsOf = (products: CartProductRef[]) => products.map((p) => p.productId).sort();
      expect(productIdsOf(fullCart.products)).toEqual(productIdsOf(products));
    });

    test("clearCart", async () => {
      const fullCart = await cartService.addProductsToCart([milk, carrots]);
      expect(fullCart.products.length).toBe(2);

      const response = await cartService.clearCart();
      expect(response.success).toBe(true);
      const emptyCart = await cartService.getCart();
      expect(emptyCart.products.length).toBe(0);
    });
  });

  describe("snapshot tests", () => {
    /**
     * Overwrites changeable properties with fixed values for the snapshot.
     * @param cart Cart
     * @returns Snapshot-ready cart
     */
    function cartSnapshot(cart: FoodstuffsCart): FoodstuffsCart {
      return { ...cart, products: cart.products.map((product) => ({ ...product, price: 0 })) };
    }

    test("getCart", async () => {
      await cartService.addProductsToCart([milk, carrots]);
      const cart = await cartService.getCart();
      expect(cartSnapshot(cart)).toMatchSnapshot();
    });

    test("addProductsToCart", async () => {
      const cart = await cartService.addProductsToCart([milk, carrots]);
      expect(cartSnapshot(cart)).toMatchSnapshot();
    });

    test("clearCart", async () => {
      await cartService.addProductsToCart([milk, carrots]);
      expect(await cartService.clearCart()).toEqual({ success: true });
    });
  });
});
