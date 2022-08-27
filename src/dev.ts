import { container, inject, injectable } from "tsyringe";
import { AppTokens, registerDefaultDependencies } from "./app/di";
import { PromptProvider } from "./prompts/prompt-provider";
import { registerCountdownDependencies } from "./store/countdown/countdown-di";
import { registerFoodstuffsDependencies } from "./store/foodstuffs/foodstuffs-di";
import { Logger } from "./utils/logger";

/* eslint-disable */
@injectable()
export class Dev {
  private readonly logger = new Logger(this.constructor.name);

  constructor(@inject(AppTokens.promptProvider) readonly prompt: PromptProvider) {}

  async main() {
    const confirm = await this.prompt.confirm("confirm");
    this.logger.info(`confirm: ${confirm}`);

    // const multiselect = await this.prompt.multiselect("multiselect", [
    //   { title: "Option 1", value: "1" },
    //   { title: "Option 2", value: "2" },
    //   { title: "Option 3", value: "3" },
    // ]);
    // this.logger.info(`multiselect: ${multiselect}`);

    const select = await this.prompt.select("select", [
      { title: "Option 1", value: "value1" },
      { title: "Option 2", value: "value2" },
      { title: "Option 3", value: "value3" },
    ]);
    this.logger.info(`select: ${select}`);

    const text = await this.prompt.text("text");
    this.logger.info(`text: ${text}`);
  }
}

export async function dev() {
  registerDefaultDependencies(container);
  registerCountdownDependencies(container);
  registerFoodstuffsDependencies(container);
  await container.resolve(Dev).main();
}
/* eslint-enable */
