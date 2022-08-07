import { getEnvAs } from "@gt/utils/environment";
import { Logger } from "@gt/utils/logger";
import { App } from "@slack/bolt";
import prompts from "prompts";
import { injectable, singleton } from "tsyringe";

/**
 * prompt types to support based on usage count:
 * - select: 10
 * - confirm: 8
 * - text: 3
 * - multiselect: 2 (1 autocomplete)
 */
@singleton()
export class SlackApp {
  private readonly logger = new Logger(this.constructor.name);

  async run() {
    await prompts({ type: "select", name: "value", message: "" });
    const app = new App({
      socketMode: true,
      port: 3000,
      ...getEnvAs({
        SLACK_APP_TOKEN: "appToken",
        SLACK_BOT_TOKEN: "token",
        SLACK_SIGNING_SECRET: "signingSecret",
      } as const),
    });

    // Listens to incoming messages that contain "hello"
    app.message("hello", async ({ message, say }) => {
      // say() sends a message to the channel where the event was triggered
      await say(`hello brother`);
    });

    await app.start(3000);
    this.logger.info("Slack app started.");
    await prompts({ name: "exit", type: "invisible", message: "Press Enter to exit\n" });
    await app.stop();
  }
}
