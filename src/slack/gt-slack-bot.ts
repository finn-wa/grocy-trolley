import { AppTokens } from "@gt/app/di";
import { GrocyTrolleyApp } from "@gt/app/gt-app";
import { ImportSource, IMPORT_SOURCES } from "@gt/cli/gt-cli-model";
import { Dev } from "@gt/dev";
import { Logger, prettyPrint } from "@gt/utils/logger";
import { RespondFn } from "@slack/bolt";
import { mergeMap, Subject, takeUntil } from "rxjs";
import { DependencyContainer, Disposable, inject, singleton } from "tsyringe";
import { SlackPromptProvider } from "../prompts/slack-prompt-provider";
import { SlackBoltAppTokens } from "./slack-app-tokens";
import { SlackAppService } from "./slack-app-service";
import { SlackPromptService } from "./slack-prompt-service";

/**
 * Configures the SlackBoltApp to respond to GrocyTrolleyApp commands. Each command
 * invokation gets its own instance of GrocyTrolleyApp in a tsyringe container.
 */
@singleton()
export class GrocyTrolleySlackBot implements Disposable {
  private readonly logger = new Logger(this.constructor.name);
  private readonly dispose$ = new Subject<void>();

  constructor(
    private readonly slackApp: SlackAppService,
    @inject(AppTokens.childContainer) private readonly botContainer: DependencyContainer
  ) {
    this.botContainer
      .register(AppTokens.promptProvider, { useClass: SlackPromptProvider })
      .register(AppTokens.childContainer, {
        useFactory: () => this.botContainer.createChildContainer(),
      });
    // initialise eager singletons
    this.botContainer.resolve(SlackPromptService);

    this.slackApp
      .registerCommand("/gt-import")
      .pipe(
        mergeMap(({ command, body, respond }) => {
          const arg = command.text.trim().toLowerCase();
          const source = (IMPORT_SOURCES as readonly string[]).includes(arg)
            ? (arg as ImportSource)
            : undefined;
          return this.runInSession(body.user_id, respond, (sessionContainer) =>
            sessionContainer.resolve(GrocyTrolleyApp).importFrom(source)
          );
        }),
        takeUntil(this.dispose$)
      )
      .subscribe();

    this.slackApp
      .registerCommand("/gt-export")
      .pipe(
        mergeMap(({ body, respond }) =>
          this.runInSession(body.user_id, respond, (sessionContainer) =>
            sessionContainer.resolve(GrocyTrolleyApp).exportTo()
          )
        ),
        takeUntil(this.dispose$)
      )
      .subscribe();

    this.slackApp
      .registerCommand("/gt-dev")
      .pipe(
        mergeMap(({ body, respond }) =>
          this.runInSession(body.user_id, respond, (sessionContainer) =>
            sessionContainer.resolve(Dev).main()
          )
        ),
        takeUntil(this.dispose$)
      )
      .subscribe();
  }

  dispose(): void {
    this.dispose$.next();
    this.dispose$.complete();
  }

  async run(): Promise<void> {
    await this.slackApp.run();
  }

  private async runInSession(
    userId: string,
    respond: RespondFn,
    fn: (session: DependencyContainer) => unknown
  ) {
    const sessionContainer = this.botContainer.createChildContainer();
    sessionContainer
      .register(AppTokens.childContainer, { useValue: sessionContainer })
      .register(SlackBoltAppTokens.slackUserId, { useValue: userId })
      .registerSingleton(AppTokens.promptProvider, SlackPromptProvider);
    try {
      await fn(sessionContainer);
    } catch (error) {
      const msg = prettyPrint(error);
      this.logger.error(msg);
      await respond(`Error: ${msg}`);
    } finally {
      await sessionContainer.dispose();
    }
  }
}
