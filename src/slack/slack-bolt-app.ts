import { CLIPromptProvider } from "@gt/prompts/cli-prompt-provider";
import { getEnvAs } from "@gt/utils/environment";
import { Logger, prettyPrint, slackLogger } from "@gt/utils/logger";
import {
  AckFn,
  App,
  BlockAction,
  BlockElementAction,
  RespondFn,
  SayFn,
  SlackActionMiddlewareArgs,
  SlackCommandMiddlewareArgs,
} from "@slack/bolt";
import {
  catchError,
  EMPTY,
  filter,
  map,
  merge,
  mergeMap,
  ReplaySubject,
  retry,
  shareReplay,
} from "rxjs";
import { Disposable, singleton } from "tsyringe";

/**
 * Simplified version of SlackActionMiddlewareArgs. Allows us to access payload.action_id
 * without having to cast.
 */
export interface SlackActionArgs<
  Action extends BlockAction<BlockElementAction> = BlockAction<BlockElementAction>
> {
  payload: Action;
  action: this["payload"];
  body: Action;
  say: SayFn;
  respond: RespondFn;
  ack: AckFn<Action>;
}

@singleton()
export class SlackBoltApp implements Disposable {
  readonly port = 3000;
  /** Args received from command hooks */
  readonly command$ = new ReplaySubject<SlackCommandMiddlewareArgs>(1);
  /** Args received from action hooks */
  readonly action$ = new ReplaySubject<SlackActionMiddlewareArgs>(1);
  /** Actions and events in a single stream */
  readonly event$ = merge(
    this.command$.pipe(
      map((event) => ({ type: "command" as const, userId: event.body.user_id, event }))
    ),
    this.action$.pipe(
      map((event) => ({ type: "action" as const, userId: event.body.user.id, event }))
    )
  ).pipe(shareReplay(1));

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

  constructor(private readonly cliPrompt: CLIPromptProvider) {
    // Handle acknowledgements
    this.event$
      .pipe(
        mergeMap(({ event }) => event.ack()),
        retry({ count: 3, delay: 750, resetOnSuccess: true }),
        catchError((err) => {
          this.logger.error(`Ack failed: ${prettyPrint(err)}`);
          return EMPTY;
        })
      )
      .subscribe();

    // Handle logging
    this.event$.subscribe(({ type, event }) => {
      this.logger.debug(`${type}: ${prettyPrint(event)}`);
    });
  }

  async dispose(): Promise<void> {
    this.logger.info("Disposing SlackBoltApp");
    await this.app.stop();
    this.command$.complete();
    this.action$.complete();
  }

  async run() {
    await this.app.start(this.port);
    this.logger.info(`Slack app started on port ${this.port}`);
    await this.cliPrompt.invisibleText("Press Enter to exit\n");
    await this.app.stop();
  }

  /**
   * Tells the app to listen for the specified action.
   * @param actionId regex or string to match action ID
   * @returns observable of matching action notifications
   */
  registerAction(actionId: string | RegExp) {
    this.app.action(actionId, async (args) => this.action$.next(args));
    const matchActionId = this.stringMatcher(actionId);
    return this.action$.pipe(
      filter((args) => matchActionId((args.payload as { action_id?: string }).action_id))
    );
  }

  registerCommand(command: string | RegExp) {
    this.app.command(command, async (args) => this.command$.next(args));
    const matchCommand = this.stringMatcher(command);
    return this.command$.pipe(
      filter((args) => {
        const match = matchCommand(args.command.command);
        this.logger.debug(`${args.command.text} matches ${command}: ${match}`);
        return match;
      })
    );
  }

  stringMatcher(pattern: string | RegExp) {
    return typeof pattern === "string"
      ? (x?: string) => x === pattern
      : (x?: string) => !!x && pattern.test(x);
  }
}
