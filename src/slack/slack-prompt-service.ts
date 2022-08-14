import { SelectChoice } from "@gt/prompts/prompt-provider";
import { Logger, prettyPrint } from "@gt/utils/logger";
import {
  BasicElementAction,
  ButtonAction,
  MultiStaticSelectAction,
  PlainTextInputAction,
  PlainTextOption,
  RadioButtonsAction,
  RespondArguments,
  SlackAction,
} from "@slack/bolt";
import { filter, first, firstValueFrom, forkJoin, map, Observable, Subject, switchMap } from "rxjs";
import { singleton } from "tsyringe";
import { SlackBoltApp } from "./slack-bolt-app";

interface ActionArgs<T extends BasicElementAction> {
  body: SlackAction;
  payload: T;
}

/**
 * A global-scoped singleton service that interacts with the Slack app to
 * provide a prompt-style interface. This service is wrapped by the
 * session-scoped service SlackPromptProvider that supplies a user ID to conform
 * to the PromptProvider interface.
 */
@singleton()
export class SlackPromptService {
  private readonly logger = new Logger(this.constructor.name);

  /** Action invocations */
  private readonly action$ = {
    select: new Subject<ActionArgs<RadioButtonsAction>>(),
    confirm: new Subject<ActionArgs<ButtonAction>>(),
    text: new Subject<ActionArgs<PlainTextInputAction>>(),
    multiSelect: new Subject<ActionArgs<MultiStaticSelectAction>>(),
  } as const;

  constructor(private readonly slackApp: SlackBoltApp) {
    this.slackApp.registerActionListener("prompt:select", async ({ body, payload }) => {
      if (payload.type !== "radio_buttons") {
        this.logger.error("Unexpected payload type: " + payload.type);
        return;
      }
      this.action$.select.next({ body, payload });
    });

    this.slackApp.registerActionListener(/prompt:confirm:\w+/, async ({ body, payload }) => {
      if (payload.type !== "button" || !("action_id" in payload)) {
        this.logger.error("Unexpected payload " + prettyPrint(payload));
        return;
      }
      this.action$.confirm.next({ body, payload });
    });

    this.slackApp.registerActionListener("prompt:text", async ({ body, payload }) => {
      if (payload.type !== "plain_text_input") {
        this.logger.error("Unexpected payload type: " + payload.type);
        return;
      }
      this.action$.text.next({ body, payload });
    });

    this.slackApp.registerActionListener("prompt:multiSelect", async ({ body, payload }) => {
      if (payload.type !== "multi_static_select") {
        this.logger.error("Unexpected payload type: " + payload.type);
        return;
      }
      this.action$.multiSelect.next({ body, payload });
    });
  }

  /**
   * Displays a select prompt to the specified user and returns their selected choice.
   *
   * @param userId the id of the user to prompt
   * @param message the message to display above the chocies
   * @param choices the prompt choices to select from
   * @returns the user's selected choice, or null if they exited the prompt
   */
  async select<T>(userId: string, message: string, choices: SelectChoice<T>[]): Promise<T | null> {
    const values = choices.map((choice) => choice.value);
    const choicesWithIndexValues = choices.map((choice, index) => ({
      ...choice,
      value: index.toString(),
    }));
    const response = await this.sendPrompt(
      userId,
      this.selectBlocks(message, choicesWithIndexValues),
      this.action$.select
    );
    const selectedIndex = response.payload.selected_option?.value ?? null;
    if (selectedIndex === null) {
      return null;
    }
    return values[parseInt(selectedIndex)] ?? null;
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
              options: choices.map(this.choiceToSlackOption),
              action_id: "prompt:select",
            },
          ],
        },
      ],
    };
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
   * @param message text to display above the prompt
   * @param choices the prompt choices to select from
   * @returns the user's selected choices
   */
  async multiSelect<T>(userId: string, message: string, choices: SelectChoice<T>[]): Promise<T[]> {
    const values = choices.map((choice) => choice.value);
    const choicesWithIndexValues = choices.map((choice, index) => ({
      ...choice,
      value: index.toString(),
    }));
    const response = await this.sendPrompt(
      userId,
      this.multiSelectBlocks(message, choicesWithIndexValues),
      this.action$.multiSelect
    );
    return response.payload.selected_options.map((option) => values[parseInt(option.value)]);
  }

  private multiSelectBlocks(message: string, choices: SelectChoice<string>[]): RespondArguments {
    return {
      text: message,
      blocks: [
        {
          type: "input",
          label: { text: message, type: "plain_text", emoji: true },
          element: {
            type: "multi_static_select",
            placeholder: { type: "plain_text", text: "Select options", emoji: true },
            options: choices.map(this.choiceToSlackOption),
            action_id: "prompt:multiSelect",
          },
        },
      ],
    };
  }

  /**
   * Displays a confirmation prompt to the specified user and returns their response.
   *
   * @param userId the id of the user to prompt
   * @param message the text to display above the prompt
   * @returns true if the user confirmed or false if they cancelled
   */
  async confirm(userId: string, message: string): Promise<boolean> {
    const response = await this.sendPrompt(
      userId,
      this.confirmBlocks(message),
      this.action$.confirm
    );
    return response.payload.value === "true";
  }

  private confirmBlocks(message: string): RespondArguments {
    return {
      text: message,
      blocks: [
        {
          type: "section",
          text: { type: "plain_text", text: message, emoji: true },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { text: "Cancel", type: "plain_text", emoji: false },
              value: "false",
              action_id: "prompt:confirm:false",
            },
            {
              type: "button",
              text: { text: "Confirm", type: "plain_text", emoji: false },
              style: "primary",
              value: "true",
              action_id: "prompt:confirm:true",
            },
          ],
        },
      ],
    };
  }

  /**
   *
   * @param userId the id of the user to prompt
   * @param message to use as the label for the prompt
   * @returns the user's inputted text
   */
  async text(userId: string, message: string): Promise<string | null> {
    const response = await this.sendPrompt(userId, this.textBlocks(message), this.action$.text);
    return response.payload.value ?? null;
  }

  private textBlocks(message: string): RespondArguments {
    return {
      blocks: [
        {
          label: { text: message, type: "plain_text", emoji: true },
          dispatch_action: true,
          type: "input",
          element: {
            type: "plain_text_input",
            action_id: "prompt:text",
          },
        },
      ],
    };
  }

  /**
   * Prompts the user with the specified message and returns the user's response.
   * Prompts are sent with the app's latest "respond" function, so they are only
   * visible to the user.
   *
   * @param userId the user to send the message to
   * @param message to send the user
   * @param actionStream observable that emits the corresponding action
   * @returns the user's response
   */
  private sendPrompt<T extends BasicElementAction>(
    userId: string,
    message: string | RespondArguments,
    actionStream: Observable<ActionArgs<T>>
  ): Promise<ActionArgs<T>> {
    return firstValueFrom(
      this.slackApp.respond$.pipe(
        filter(({ userId }) => userId === userId),
        first(),
        switchMap(({ respond }) =>
          forkJoin({
            // Send message to user using the latest "respond" function
            message: respond(message),
            // Wait for user's reply
            userResponse: actionStream.pipe(
              filter((args) => args.body.user.id === userId),
              first()
            ),
          })
        ),
        map(({ userResponse }) => userResponse)
      )
    );
  }
}
