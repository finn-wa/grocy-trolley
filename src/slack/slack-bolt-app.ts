import { getEnvAs } from "@gt/utils/environment";
import { Logger, prettyPrint, slackLogger } from "@gt/utils/logger";
import { App, RespondFn } from "@slack/bolt";
import prompts from "prompts";
import { retry, Subject, switchMap } from "rxjs";
import { singleton } from "tsyringe";

@singleton()
export class SlackBoltApp {
  /** Emits the latest respond() functions */
  readonly respond$ = new Subject<{ userId: string; respond: RespondFn }>();
  readonly port = 3000;

  private readonly app = new App({
    socketMode: true,
    port: this.port,
    logger: slackLogger(),
    ...getEnvAs({
      SLACK_APP_TOKEN: "appToken",
      SLACK_BOT_TOKEN: "token",
      SLACK_SIGNING_SECRET: "signingSecret",
    } as const),
  });
  private readonly logger = new Logger(this.constructor.name);
  /** Accepts acknowledgements to send */
  private readonly ack$ = new Subject<() => Promise<void>>();

  constructor() {
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
    this.app.message("hello", async ({ say }) => {
      await say(`hello brother`);
    });
    await this.app.start(this.port);
    this.logger.info(`Slack app started on port ${this.port}`);
    await prompts({ name: "exit", type: "invisible", message: "Press Enter to exit\n" });
    await this.app.stop();
  }

  registerActionListener(actionId: string | RegExp, listener: Parameters<App["action"]>[1]) {
    this.app.action(actionId, async (args) => {
      const { ack, respond, body } = args;
      this.ack$.next(ack);
      this.respond$.next({ respond, userId: body.user.id });
      return listener(args);
    });
  }

  registerCommandListener(commandName: string | RegExp, listener: Parameters<App["command"]>[1]) {
    this.app.command(commandName, async (args) => {
      const { ack, respond, body } = args;
      this.ack$.next(ack);
      this.respond$.next({ respond, userId: body.user_id });
      return listener(args);
    });
  }
}
