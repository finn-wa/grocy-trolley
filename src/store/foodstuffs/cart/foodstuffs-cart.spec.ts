import { expectSchemaToValidate } from "@gt/jtd/test-utils";
import { beforeEach, describe, expect, test } from "vitest";
import { beforeAllFoodstuffsTests, foodstuffsTestContainer } from "../test/foodstuffs-test-utils";
import { FoodstuffsCartController } from "./foodstuffs-cart-controller";
import { FoodstuffsCartService } from "./foodstuffs-cart-service";
import { CartProductRef } from "./foodstuffs-cart.model";
import { getCartSchema } from "./types/Cart/schema";
import { getClearCartResponseSchema } from "./types/ClearCartResponse/schema";

describe("[external] Foodstuffs Cart", () => {
  let cartController: FoodstuffsCartController;
  let cartService: FoodstuffsCartService;
  const milk: CartProductRef = {
    productId: "5201479_EA_000",
    quantity: 1,
    sale_type: "UNITS",
  };
  const carrots: CartProductRef = {
    productId: "5039965_KGM_000",
    quantity: 500,
    sale_type: "WEIGHT",
  };

  beforeAllFoodstuffsTests();

  beforeEach(async () => {
    const testContainer = foodstuffsTestContainer();
    cartController = testContainer.resolve(FoodstuffsCartController);
    cartService = testContainer.resolve(FoodstuffsCartService);
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
      const productIdsOf = (products: CartProductRef[]) =>
        products.map((p) => p.productId.replaceAll("-", "_")).sort();
      expect(productIdsOf(fullCart.products)).toEqual(productIdsOf(products));
    });

    test("clearCart", async () => {
      const fullCart = await cartService.addProductsToCart([milk, carrots]);
      expect(fullCart.products.length).toBe(2);

      const response = await cartService.clearCart();
      expect(response.success).toBe(true);
      const emptyCart = await cartService.getCart();
      expect(emptyCart.products.length).toBe(0);
    }, 10_000);
  });
});
