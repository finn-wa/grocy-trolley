import { SlackBoltAppTokens } from "@gt/slack/slack-app-tokens";
import { SlackPromptService } from "@gt/slack/slack-prompt-service";
import { Logger } from "@gt/utils/logger";
import { inject, Lifecycle, scoped } from "tsyringe";
import { SelectOptions } from "./cli-prompt-provider";
import { PromptProvider, SelectChoice } from "./prompt-provider";

@scoped(Lifecycle.ContainerScoped)
export class SlackPromptProvider implements PromptProvider {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @inject(SlackBoltAppTokens.slackUserId) private readonly userId: string,
    private readonly slackPromptService: SlackPromptService
  ) {}

  say(message: string): Promise<void> {
    this.logger.trace(`say: ${message}`);
    return this.slackPromptService.say(this.userId, message);
  }

  async select<T>(
    message: string,
    choices: SelectChoice<T>[],
    options: SelectOptions = {}
  ): Promise<T | null> {
    this.logger.trace(`select: ${message}`);
    const choice = await this.slackPromptService.select(this.userId, message, choices, options);
    this.logger.trace(`select choice: ${String(choice)}`);
    return choice;
  }

  multiselect<T>(message: string, choices: SelectChoice<T>[]): Promise<T[] | null> {
    this.logger.trace(`multiselect: ${message}`);
    return this.slackPromptService.multiselect(this.userId, message, choices);
  }

  confirm(message: string): Promise<boolean> {
    this.logger.trace(`confirm: ${message}`);
    return this.slackPromptService.confirm(this.userId, message);
  }

  text(message: string, placeholder = "Enter text"): Promise<string | null> {
    this.logger.trace(`text: ${message}`);
    return this.slackPromptService.text(this.userId, message, placeholder);
  }
}
