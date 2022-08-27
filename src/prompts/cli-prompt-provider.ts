import { Logger } from "@gt/utils/logger";
import prompts from "prompts";
import { singleton } from "tsyringe";
import { PromptProvider, SelectChoice } from "./prompt-provider";

@singleton()
export class CLIPromptProvider implements PromptProvider {
  private readonly logger = new Logger(this.constructor.name);

  async say(message: string): Promise<void> {
    console.log(message);
  }

  async select<T>(message: string, choices: SelectChoice<T>[]) {
    this.logger.trace(`select: ${message}`);
    const response = await prompts({
      message,
      type: "select",
      name: "value",
      choices,
    });
    return response.value as T | null;
  }

  async multiselect<T>(message: string, choices: SelectChoice<T>[]) {
    this.logger.trace(`multiselect: ${message}`);
    const response = await prompts({
      message,
      type: "autocompleteMultiselect",
      name: "value",
      choices,
    });
    return response.value as T[] | null;
  }

  async confirm(message: string): Promise<boolean> {
    this.logger.trace(`confirm: ${message}`);
    const response = await prompts({
      message,
      type: "confirm",
      name: "value",
    });
    return !!response.value;
  }

  async text(message: string, placeholder = "Enter text"): Promise<string | null> {
    this.logger.trace(`text: ${message}`);
    const response = await prompts({
      message,
      type: "text",
      name: "value",
      hint: placeholder,
    });
    return response.value as string | null;
  }

  async invisibleText(message: string): Promise<string | null> {
    this.logger.trace(`invisibleText: ${message}`);
    const response = await prompts({
      message,
      type: "invisible",
      name: "value",
    });
    return response.value as string | null;
  }
}
