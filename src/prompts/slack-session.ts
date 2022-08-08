import { RadioButtonsAction, RespondArguments, RespondFn } from "@slack/bolt";
import { first, firstValueFrom, forkJoin, map, ReplaySubject, Subject, switchMap } from "rxjs";
import { injectable, singleton } from "tsyringe";
import { SelectChoice } from "./prompt-provider";

@singleton()
export class SlackSessionService {
  private readonly sessions: Record<string, SlackSession> = {};
  start(id: string): SlackSession {
    const session = new SlackSession();
    this.sessions[id] = session;
    return session;
  }
}

@singleton()
export class SlackSession {
  /** Latest respond() function */
  readonly respond$ = new ReplaySubject<RespondFn>(1);
  /** Action invocations */
  readonly actions$ = {
    select: new Subject<RadioButtonsAction>(),
  } as const;

  select(message: string, choices: SelectChoice<string>[]) {
    return firstValueFrom(
      this.respond$.pipe(
        first(),
        switchMap((respond) =>
          forkJoin({
            respond: respond(this.selectBlocks(message, choices)),
            action: this.actions$.select.pipe(first()),
          })
        ),
        map(({ action }) => action.selected_option?.value ?? null)
      )
    );
  }

  private selectBlocks(message: string, choices: SelectChoice<string>[]): RespondArguments {
    return {
      text: message,
      blocks: [
        {
          type: "actions",
          elements: [
            {
              type: "radio_buttons",
              options: choices.map((choice) => ({
                text: { text: choice.title, type: "plain_text", emoji: true },
                value: choice.value,
              })),
              action_id: "prompt.select",
            },
          ],
        },
      ],
    };
  }
}
