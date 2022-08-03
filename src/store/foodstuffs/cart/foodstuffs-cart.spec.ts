import { expectSchemaToValidate } from "@gt/jtd/test-utils";
import { LoginDetails } from "@gt/store/shared/rest/login-details.model";
import { getEnvAs, initEnv } from "@gt/utils/environment";
import { getBrowser } from "../../shared/rest/browser";
import { FoodstuffsAuthHeaderProvider } from "../rest/foodstuffs-auth-header-provider";
import { FoodstuffsCartController } from "./foodstuffs-cart-controller";
import { FoodstuffsCartService } from "./foodstuffs-cart-service";
import { CartProductRef } from "./foodstuffs-cart.model";
import { getCartSchema } from "./types/Cart/schema";
import { getClearCartResponseSchema } from "./types/ClearCartResponse/schema";

describe("Foodstuffs Cart", () => {
  let cartController: FoodstuffsCartController;
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
    const userAgent = new FoodstuffsAuthHeaderProvider(getBrowser, loginDetails);
    cartController = new FoodstuffsCartController(userAgent);
    cartService = new FoodstuffsCartService(cartController);
    await cartController.clearCart();
  });

  describe("FoodstuffsCartController", () => {
    test("getCart", async () => {
      const cart = await cartController.getCart();
      expectSchemaToValidate(getCartSchema(), cart);
    });

    test("clearCart", async () => {
      const response = await cartController.clearCart();
      expectSchemaToValidate(getClearCartResponseSchema(), response);
    });

    test("postProducts", async () => {
      const products = [milk, carrots];
      const response = await cartController.postProducts(products);
      expectSchemaToValidate(getCartSchema(), response);
    });
  });

  describe("FoodstuffsCartService", () => {
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
});
