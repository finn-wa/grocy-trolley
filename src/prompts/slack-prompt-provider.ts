import { injectable } from "tsyringe";
import { PromptProvider, SelectChoice } from "./prompt-provider";
import { SlackSession } from "./slack-session";

@injectable()
export class SlackPromptProvider implements PromptProvider {
  constructor(private readonly session: SlackSession) {}

  async select<T>(message: string, choices: SelectChoice<T>[]): Promise<T | null> {
    const values = choices.map((choice) => choice.value);
    const choicesWithIndexValues = choices.map((choice, index) => ({
      ...choice,
      value: index.toString(),
    }));
    const selectedIndex = await this.session.select(message, choicesWithIndexValues);
    if (selectedIndex === null) {
      return null;
    }
    return values[parseInt(selectedIndex)];
  }
}
