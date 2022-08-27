import { AppTokens } from "@gt/app/di";
import { SlackPromptService } from "@gt/slack/slack-prompt-service";
import { Logger } from "@gt/utils/logger";
import { inject, Lifecycle, scoped } from "tsyringe";
import { PromptProvider, SelectChoice } from "./prompt-provider";

@scoped(Lifecycle.ContainerScoped)
export class SlackPromptProvider implements PromptProvider {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @inject(AppTokens.slackUserId) private readonly userId: string,
    private readonly promptService: SlackPromptService
  ) {}

  say(message: string): Promise<void> {
    this.logger.trace(`say: ${message}`);
    return this.promptService.say(this.userId, message);
  }

  select<T>(message: string, choices: SelectChoice<T>[]): Promise<T | null> {
    this.logger.trace(`select: ${message}`);
    return this.promptService.select(this.userId, message, choices);
  }

  multiselect<T>(message: string, choices: SelectChoice<T>[]): Promise<T[] | null> {
    this.logger.trace(`multiselect: ${message}`);
    return this.promptService.multiselect(this.userId, message, choices);
  }

  confirm(message: string): Promise<boolean> {
    this.logger.trace(`confirm: ${message}`);
    return this.promptService.confirm(this.userId, message);
  }

  text(message: string, placeholder = "Enter text"): Promise<string | null> {
    this.logger.trace(`text: ${message}`);
    return this.promptService.text(this.userId, message, placeholder);
  }
}
