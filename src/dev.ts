/* eslint-disable */
import "@abraham/reflection";
import { App, BlockAction } from "@slack/bolt";
import prompts from "prompts";
import { getEnvAs } from "./utils/environment";
import { Logger, prettyPrint } from "./utils/logger";

export async function dev() {
  const logger = new Logger("dev");
  const app = new App({
    socketMode: true,
    port: 3000,
    ...getEnvAs({
      SLACK_APP_TOKEN: "appToken",
      SLACK_BOT_TOKEN: "token",
      SLACK_SIGNING_SECRET: "signingSecret",
    } as const),
  });

  app.action("prompt", async ({ ack, say, payload }) => {
    await ack();
    if (payload.type !== "radio_buttons") {
      logger.error("unexpected payload type: " + prettyPrint(payload));
      return;
    }
    await say("choice: " + prettyPrint(payload.selected_option?.value));
  });

  // Listens to incoming messages that contain "hello"
  app.message("gt", async ({ message, say }) => {
    // say() sends a message to the channel where the event was triggered
    await say({
      blocks: [
        {
          type: "actions",
          elements: [
            {
              type: "radio_buttons",
              options: [
                {
                  text: { text: "import", type: "plain_text", emoji: true },
                  value: "import",
                },
                {
                  text: { text: "export", type: "plain_text", emoji: true },
                  value: "export",
                },
              ],
              action_id: "prompt",
            },
          ],
        },
      ],
    });
  });

  await app.start(3000);
  logger.info("Slack app started.");
  await prompts({ name: "exit", type: "invisible", message: "Press Enter to exit\n" });
  await app.stop();
}

/* eslint-enable */
