import prompts from "prompts";
import { PromptProvider, SelectChoice } from "./prompt-provider";

export class CLIPromptProvider implements PromptProvider {
  async select<T>(message: string, choices: SelectChoice<T>[]) {
    const response = await prompts({
      message,
      type: "select",
      name: "value",
      choices,
    });
    return response.value as T | null;
  }
}
