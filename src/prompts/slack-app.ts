import { ImportSource, IMPORT_SOURCES } from "@gt/cli/gt-cli-model";
import { getEnvAs } from "@gt/utils/environment";
import { Logger, prettyPrint, slackLogger } from "@gt/utils/logger";
import { App } from "@slack/bolt";
import prompts from "prompts";
import { retry, Subject, switchMap } from "rxjs";
import { singleton } from "tsyringe";
import { SlackSession } from "./slack-session";

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
  /** Accepts acknowledgements to send */
  private readonly ack$ = new Subject<() => Promise<void>>();

  constructor(private readonly session: SlackSession) {
    this.ack$
      .pipe(
        switchMap((ack) => ack()),
        retry({ count: 1, delay: 750 })
      )
      .subscribe({
        error: (err) => this.logger.error("Ack failed: " + prettyPrint(err)),
      });
  }

  async run() {
    await prompts({ type: "select", name: "value", message: "" });
    const app = new App({
      socketMode: true,
      port: 3000,
      ...slackLogger(),
      ...getEnvAs({
        SLACK_APP_TOKEN: "appToken",
        SLACK_BOT_TOKEN: "token",
        SLACK_SIGNING_SECRET: "signingSecret",
      } as const),
    });

    app.message("hello", async ({ say }) => {
      await say(`hello brother`);
    });

    app.action("prompt.select", async ({ ack, respond, payload }) => {
      if (payload.type !== "radio_buttons") {
        throw new Error("Unexpected payload type: " + payload.type);
      }
      this.ack$.next(ack);
      this.session.actions$.select.next(payload);
      this.session.respond$.next(respond);
    });

    app.command("/import", async ({ command, ack, respond }) => {
      this.ack$.next(ack);
      const arg = command.text.trim().toLowerCase();
      const source = (IMPORT_SOURCES as readonly string[]).includes(arg)
        ? (arg as ImportSource)
        : undefined;
      this.logger.debug("import command: " + prettyPrint(command));
      this.session.respond$.next(respond);
    });

    await app.start(3000);
    this.logger.info("Slack app started.");
    await prompts({ name: "exit", type: "invisible", message: "Press Enter to exit\n" });
    await app.stop();
  }
}
