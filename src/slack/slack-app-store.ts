import { Logger, prettyPrint } from "@gt/utils/logger";
import {
  RespondFn,
  SayFn,
  SlackActionMiddlewareArgs,
  SlackCommandMiddlewareArgs,
} from "@slack/bolt";
import { catchError, EMPTY, filter, map, Observable, ReplaySubject, tap } from "rxjs";
import { singleton } from "tsyringe";
import { SlackBoltApp } from "./slack-bolt-app";

export type UserInteractionState = {
  command?: SlackCommandMiddlewareArgs;
  action?: SlackActionMiddlewareArgs;
  respond: RespondFn;
  say: SayFn;
};
export type UserInteractionStore = { [userId: string]: UserInteractionState };

@singleton()
export class SlackUserInteractionStore {
  readonly store$: ReplaySubject<UserInteractionStore> = new ReplaySubject(1);
  private readonly store: UserInteractionStore = {};
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly app: SlackBoltApp) {
    app.event$
      .pipe(
        tap((event) => {
          const state = this.store[event.userId];
          if (event.type === "action") {
            const action = event.event;
            this.store[event.userId] = {
              ...state,
              action,
              respond: action.respond,
              say: action.say,
            };
          } else if (event.type === "command") {
            const command = event.event;
            this.store[event.userId] = {
              ...state,
              command,
              respond: command.respond,
              say: command.say,
            };
          }
          this.store$.next(this.store);
        }),
        catchError((err) => {
          this.logger.error(prettyPrint(err));
          return EMPTY;
        })
      )
      .subscribe();
  }

  selectUser(userId: string): Observable<UserInteractionState> {
    return this.store$.pipe(
      map((store) => store[userId]),
      filter((userState) => !!userState)
    );
  }
}
