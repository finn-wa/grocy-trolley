import { AppTokens } from "@gt/app-tokens";
import { SlackPromptService } from "@gt/slack/slack-prompt-service";
import { inject, Lifecycle, scoped } from "tsyringe";
import { PromptProvider, SelectChoice } from "./prompt-provider";

@scoped(Lifecycle.ContainerScoped)
export class SlackPromptProvider implements PromptProvider {
  constructor(
    @inject(AppTokens.slackUserId) private readonly userId: string,
    private readonly promptService: SlackPromptService
  ) {}

  select<T>(message: string, choices: SelectChoice<T>[]): Promise<T | null> {
    return this.promptService.select(this.userId, message, choices);
  }

  multiSelect<T>(message: string, choices: SelectChoice<T>[]): Promise<T[] | null> {
    return this.promptService.multiSelect(this.userId, message, choices);
  }

  confirm(message: string): Promise<boolean> {
    return this.promptService.confirm(this.userId, message);
  }

  text(message: string): Promise<string | null> {
    return this.promptService.text(this.userId, message);
  }
}
