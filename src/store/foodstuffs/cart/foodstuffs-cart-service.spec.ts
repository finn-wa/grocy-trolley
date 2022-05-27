import { LoginDetails } from "@gt/store/shared/rest/login-details.model";
import { getEnvAs, initEnv } from "@gt/utils/environment";
import { getBrowser } from "../../shared/rest/browser";
import { FoodstuffsUserAgent } from "../rest/foodstuffs-user-agent";
import { FoodstuffsCartController } from "./foodstuffs-cart-controller";
import { FoodstuffsCartService } from "./foodstuffs-cart-service";
import { CartProductRef } from "./foodstuffs-cart.model";

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
    cartService = new FoodstuffsCartService(new FoodstuffsCartController(userAgent));
    await cartService.clearCart();
  });

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
