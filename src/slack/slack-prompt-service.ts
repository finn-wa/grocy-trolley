import { SelectChoice } from "@gt/prompts/prompt-provider";
import { Logger, prettyPrint } from "@gt/utils/logger";
import {
  BasicElementAction,
  BlockAction,
  ButtonAction,
  KnownBlock,
  MultiStaticSelectAction,
  PlainTextInputAction,
  PlainTextOption,
  RadioButtonsAction,
  RespondArguments,
  SlackActionMiddlewareArgs,
} from "@slack/bolt";
import {
  filter,
  first,
  firstValueFrom,
  forkJoin,
  map,
  mergeMap,
  Observable,
  share,
  switchMap,
  tap,
} from "rxjs";
import { singleton } from "tsyringe";
import { SlackUserInteractionStore } from "./slack-user-interaction-store";
import {
  confirmButtons,
  markdownSection,
  textSection,
  updatedConfirmButtons,
} from "./slack-blocks";
import { SlackAppService } from "./slack-app-service";
import { SelectOptions } from "@gt/prompts/cli-prompt-provider";

type ActionArgs<Payload extends BasicElementAction> = SlackActionMiddlewareArgs & {
  body: BlockAction;
  payload: Payload;
};

/**
 * A global-scoped singleton service that interacts with the Slack app to
 * provide a prompt-style interface. This service is wrapped by the
 * session-scoped service SlackPromptProvider that supplies a user ID to conform
 * to the PromptProvider interface.
 */
@singleton()
export class SlackPromptService {
  private readonly logger = new Logger(this.constructor.name);
  private readonly actionIds = {
    select: "prompt:select",
    confirm: "prompt:confirm",
    text: "prompt:text",
    multiselect: "prompt:multiselect",
  } as const;

  /** Action invocations */
  private readonly action$: {
    select: Observable<ActionArgs<ButtonAction>>;
    confirm: Observable<ActionArgs<ButtonAction>>;
    text: Observable<ActionArgs<PlainTextInputAction>>;
    multiSelect: Observable<ActionArgs<MultiStaticSelectAction>>;
  };

  constructor(
    private readonly slackApp: SlackAppService,
    private readonly interactionStore: SlackUserInteractionStore
  ) {
    const matchPrefix = (id: string) => new RegExp(id + "[\\w:-]*");
    this.action$ = {
      select: this.slackApp.registerAction(matchPrefix(this.actionIds.select)).pipe(
        filter((args): args is ActionArgs<ButtonAction> =>
          this.hasPayloadType(args.payload, "button")
        ),
        share()
      ),
      confirm: this.slackApp.registerAction(matchPrefix(this.actionIds.confirm)).pipe(
        filter((args): args is ActionArgs<ButtonAction> =>
          this.hasPayloadType(args.payload, "button")
        ),
        share()
      ),
      text: this.slackApp.registerAction(matchPrefix(this.actionIds.text)).pipe(
        filter((args): args is ActionArgs<PlainTextInputAction> =>
          this.hasPayloadType(args.payload, "plain_text_input")
        ),
        share()
      ),
      multiSelect: this.slackApp.registerAction(matchPrefix(this.actionIds.multiselect)).pipe(
        filter((args): args is ActionArgs<MultiStaticSelectAction> =>
          this.hasPayloadType(args.payload, "multi_static_select")
        ),
        share()
      ),
    };
  }

  private hasPayloadType<T extends SlackActionMiddlewareArgs["payload"]>(
    payload: SlackActionMiddlewareArgs["payload"],
    payloadType: T["type"]
  ): payload is T {
    if (payload.type !== payloadType) {
      this.logger.error(
        `Expected payload of type ${payload.type}, received: ${prettyPrint(payload)}`
      );
      return false;
    }
    return true;
  }

  async say(userId: string, message: string): Promise<void> {
    await firstValueFrom(
      this.interactionStore.store$.pipe(
        map((store) => store[userId]),
        first((state) => !!state),
        switchMap((state) => state.say(message))
      )
    );
  }

  /**
   * Displays a select prompt to the specified user and returns their selected choice.
   *
   * @param userId the id of the user to prompt
   * @param text the message to display above the chocies
   * @param choices the prompt choices to select from
   * @returns the user's selected choice, or null if they exited the prompt
   */
  async select<T>(
    userId: string,
    text: string,
    choices: SelectChoice<T>[],
    selectOptions: SelectOptions
  ): Promise<T | null> {
    const options = choices.map((choice, index) =>
      this.choiceToSlackOption({ ...choice, value: index.toString() })
    );
    if (selectOptions.includeExitOption) {
      options.push({ text: { text: "Exit", type: "plain_text" } });
    }
    const blockId = `${this.actionIds.select}:block`;
    const actionId = `${this.actionIds.select}:interaction`;
    const blocks: KnownBlock[] = [
      textSection(text),
      {
        type: "actions",
        elements: [{ type: "radio_buttons", options, action_id: actionId }],
        block_id: blockId,
      },
      confirmButtons(this.actionIds.select),
    ];
    const message = this.buildMessage(text, blocks);
    const { submitAction: selectAction } = await firstValueFrom(
      forkJoin({
        prompt: this.sendMessageToUser(userId, message),
        // Wait for user to interact
        submitAction: this.action$.select.pipe(first(({ body }) => body.user.id === userId)),
      })
    );
    const selectedIndex = parseInt(
      selectAction.body.state?.values[blockId][actionId]?.selected_option?.value as string
    );
    const selectedChoice = choices[selectedIndex];
    const selectedChoiceText = String(selectedChoice?.title ?? "None");
    await selectAction.respond(
      this.buildMessageUpdate(`${text} (${selectedChoiceText})`, [
        blocks[0],
        markdownSection(
          choices
            .map((choice, index) => `${index === selectedIndex ? "🔘" : "⚪"} ${choice.title}`)
            .join("\n\n")
        ),
        updatedConfirmButtons(selectAction.action.action_id),
      ])
    );
    return selectedChoice?.value ?? null;
  }

  private sendMessageToUser(userId: string, message: RespondArguments): Observable<unknown> {
    return this.interactionStore.selectUser(userId).pipe(
      first(),
      switchMap(({ respond }) => respond(message))
    );
  }

  private choiceToSlackOption(this: void, choice: SelectChoice<string>): PlainTextOption {
    return {
      text: { text: choice.title, type: "plain_text", emoji: true },
      value: choice.value,
    };
  }

  /**
   * Displays a multiselect prompt to the specified user and returns their selected choices
   * .
   * @param userId the id of the user to prompt
   * @param text to display above the prompt
   * @param choices the prompt choices to select from
   * @returns the user's selected choices
   */
  async multiselect<T>(userId: string, text: string, choices: SelectChoice<T>[]): Promise<T[]> {
    const values = choices.map((choice) => choice.value);
    const choicesWithIndexValues = choices.map((choice, index) => ({
      ...choice,
      value: index.toString(),
    }));
    const blocks = this.multiselectBlocks(text, choicesWithIndexValues);
    const response = await this.sendPromptMessage(
      userId,
      this.buildMessage(text, blocks),
      this.action$.multiSelect
    );
    return response.payload.selected_options.map((option) => values[parseInt(option.value)]);
  }

  private multiselectBlocks(text: string, choices: SelectChoice<string>[]): KnownBlock[] {
    return [
      {
        type: "input",
        label: { text, type: "plain_text", emoji: true },
        element: {
          type: "multi_static_select",
          placeholder: { type: "plain_text", text: "Select options", emoji: true },
          options: choices.map(this.choiceToSlackOption),
          action_id: this.actionIds.multiselect,
        },
      },
    ];
  }

  /**
   * Displays a confirmation prompt to the specified user and returns their response.
   *
   * @param userId the id of the user to prompt
   * @param text the text to display above the prompt
   * @returns true if the user confirmed or false if they cancelled
   */
  async confirm(userId: string, text: string): Promise<boolean> {
    const blocks = [textSection(text), confirmButtons(this.actionIds.confirm)];
    const message = this.buildMessage(text, blocks);
    const { confirmAction } = await firstValueFrom(
      forkJoin({
        // Send the prompt to user
        prompt: this.interactionStore.selectUser(userId).pipe(
          first(),
          mergeMap(({ respond }) => respond(message))
        ),
        // Wait for user to interact
        confirmAction: this.action$.confirm.pipe(first(({ body }) => body.user.id === userId)),
      })
    );
    // Cancel action_id has a :cancel suffix
    const confirmed = confirmAction.action.action_id === this.actionIds.confirm;
    const confirmedText = confirmed ? "Confirm" : "Cancel";
    await confirmAction.respond(
      this.buildMessageUpdate(`${text} (${confirmedText})`, [
        blocks[0],
        updatedConfirmButtons(confirmAction.action.action_id),
      ])
    );
    return confirmed;
  }

  /**
   *
   * @param userId the id of the user to prompt
   * @param label to use as the label for the prompt
   * @returns the user's inputted text
   */
  async text(userId: string, label: string, placeholder = "Enter text"): Promise<string | null> {
    const blockId = `${this.actionIds.text}:block`;
    const actionId = `${this.actionIds.text}:interaction`;
    const blocks: KnownBlock[] = [
      {
        label: { text: label, type: "plain_text", emoji: false },
        dispatch_action: true,
        type: "input",
        block_id: blockId,
        element: {
          type: "plain_text_input",
          action_id: actionId,
          placeholder: { type: "plain_text", text: placeholder, emoji: true },
        },
      },
      confirmButtons(this.actionIds.text),
    ];
    const { submitAction } = await firstValueFrom(
      forkJoin({
        prompt: this.sendMessageToUser(userId, this.buildMessage(label, blocks)),
        // Wait for user to interact
        submitAction: this.action$.text.pipe(first(({ body }) => body.user.id === userId)),
      })
    );
    const textInput = submitAction.body.state?.values[blockId][actionId]?.value ?? null;
    await submitAction.respond(
      this.buildMessageUpdate(`${label} (${textInput ?? "None"})`, [
        markdownSection(`*${label}*\n> ${textInput ?? "None"}`),
        updatedConfirmButtons(submitAction.action.action_id),
      ])
    );
    return textInput;
  }

  private buildMessage(text: string, blocks: RespondArguments["blocks"]): RespondArguments {
    return {
      text,
      blocks,
      delete_original: false,
      replace_original: false,
    };
  }

  private buildMessageUpdate(text: string, blocks: RespondArguments["blocks"]): RespondArguments {
    return {
      text,
      blocks,
      replace_original: true,
    };
  }

  /**
   * Prompts the user with the specified message and returns the user's response.
   * Prompts are sent with the app's latest "respond" function, so they are only
   * visible to the user.
   *
   * @param userId the user to send the message to
   * @param message message to send the user
   * @param actionStream observable that emits the corresponding action
   * @returns the user's response
   */
  private sendPromptMessage<T extends BasicElementAction>(
    userId: string,
    message: string | RespondArguments,
    actionStream: Observable<ActionArgs<T>>
  ): Promise<ActionArgs<T>> {
    return firstValueFrom(
      this.interactionStore.store$.pipe(
        map((store) => store[userId]),
        first((state) => !!state),
        switchMap((state) =>
          forkJoin({
            // Send message to user using the latest "respond" function
            message: state.respond(message),
            // Wait for user's reply
            userResponse: actionStream.pipe(first((args) => args.body.user.id === userId)),
          })
        ),
        map(({ userResponse }) => userResponse),
        // we need a submit button on each prompt message that can be disabled after first submit
        // otherwise many responses can be sent by yser
        // for multiselect, a response for each select
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        tap(({ respond }) =>
          respond({
            text: "thanks",
            replace_original: true,
          })
        )
      )
    );
  }
}
