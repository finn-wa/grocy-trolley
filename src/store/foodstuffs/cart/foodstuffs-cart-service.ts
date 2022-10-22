import { AppTokens } from "@gt/app/di";
import { PromptProvider } from "@gt/prompts/prompt-provider";
import { Logger, prettyPrint } from "@gt/utils/logger";
import { RequestError } from "@gt/utils/rest";
import { inject, Lifecycle, scoped } from "tsyringe";
import { FoodstuffsCartController } from "./foodstuffs-cart-controller";
import { CartProductRef, FoodstuffsCart } from "./foodstuffs-cart.model";

@scoped(Lifecycle.ContainerScoped)
export class FoodstuffsCartService {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    @inject(FoodstuffsCartController) private readonly controller: FoodstuffsCartController,
    @inject("PromptProvider") private readonly prompt: PromptProvider
  ) {}

  getCart = () => this.controller.getCart();

  clearCart = () => this.controller.clearCart();

  async addProductsToCart(products: CartProductRef[]): Promise<FoodstuffsCart> {
    try {
      const cart = await this.controller.postProducts(products);
      return cart;
    } catch (error) {
      this.logger.error("Failed to add products to cart. Falling back to chunks.");
      if (error instanceof RequestError) {
        this.logger.debug(await error.response.text());
      }
    }
    const iter = products[Symbol.iterator]();
    let chunk: CartProductRef[];
    do {
      chunk = Array.from(
        { length: 5 },
        () => iter.next().value as CartProductRef | undefined
      ).filter((p): p is CartProductRef => !!p);
      try {
        await this.controller.postProducts(chunk);
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
        await this.controller.postProducts([product]);
      } catch (error) {
        this.logger.error("Failed to add product to cart!\n" + prettyPrint(product));
        if (error instanceof RequestError) {
          this.logger.debug(await error.response.text());
        }
        const resume = await this.prompt.confirm("Resume adding products?");
        if (!resume) {
          throw error;
        }
      }
    }
    return this.getCart();
  }
}
