import prompts from "prompts";
import { singleton } from "tsyringe";
import { PromptProvider, SelectChoice } from "./prompt-provider";

@singleton()
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

  async multiSelect<T>(message: string, choices: SelectChoice<T>[]) {
    const response = await prompts({
      message,
      type: "autocompleteMultiselect",
      name: "value",
      choices,
    });
    return response.value as T[] | null;
  }

  async confirm(message: string): Promise<boolean> {
    const response = await prompts({
      message,
      type: "confirm",
      name: "value",
    });
    return !!response.value;
  }

  async text(message: string): Promise<string | null> {
    const response = await prompts({
      message,
      type: "text",
      name: "value",
    });
    return response.value as string | null;
  }
}
