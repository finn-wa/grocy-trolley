import { GrocyTrolleyApp } from "@gt/app";
import { AppTokens } from "@gt/app-tokens";
import { ImportSource, IMPORT_SOURCES } from "@gt/cli/gt-cli-model";
import { Logger } from "@gt/utils/logger";
import { container, DependencyContainer, singleton } from "tsyringe";
import { SlackBoltApp } from "./slack-bolt-app";
import { SlackPromptProvider } from "../prompts/slack-prompt-provider";
import { SlackPromptService } from "./slack-prompt-service";

/**
 * Configures the SlackBoltApp to respond to GrocyTrolleyApp commands. Each command
 * invokation gets its own instance of GrocyTrolleyApp in a tsyringe container.
 */
@singleton()
export class GrocyTrolleySlackBot {
  private readonly logger = new Logger(this.constructor.name);
  private readonly appContainer: DependencyContainer;
  private readonly eagerInitServices = [SlackPromptService];

  constructor(private readonly slackApp: SlackBoltApp) {
    this.appContainer = container.createChildContainer();
    this.eagerInitServices.forEach((service) => this.appContainer.resolve(service));

    this.slackApp.registerCommandListener("/import", async ({ body, command }) => {
      const arg = command.text.trim().toLowerCase();
      const source = (IMPORT_SOURCES as readonly string[]).includes(arg)
        ? (arg as ImportSource)
        : undefined;
      const session = this.getSessionContainer(body.user_id);
      const gt = session.resolve(GrocyTrolleyApp);
      await gt.importFrom(source);
      await session.dispose();
    });

    this.slackApp.registerCommandListener("/export", async ({ body }) => {
      const session = this.getSessionContainer(body.user_id);
      const gt = session.resolve(GrocyTrolleyApp);
      await gt.exportTo();
      await session.dispose();
    });
  }

  async run(): Promise<void> {
    await this.slackApp.run();
  }

  private getSessionContainer(userId: string): DependencyContainer {
    return this.appContainer
      .createChildContainer()
      .register(AppTokens.slackUserId, { useValue: userId })
      .registerSingleton(AppTokens.promptProvider, SlackPromptProvider);
  }
}
