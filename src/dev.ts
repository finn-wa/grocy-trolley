/* eslint-disable */
import "@abraham/reflection";
import { container } from "tsyringe";
import { registerAppDependencies } from "./app";
import { IMPORT_SOURCES } from "./cli/gt-cli-model";
import { SlackApp } from "./prompts/slack-app";
import { SlackPromptProvider } from "./prompts/slack-prompt-provider";
import { Logger } from "./utils/logger";

export async function dev() {
  registerAppDependencies(container);
  const slackApp = container.resolve(SlackApp);
  const prompt = container.resolve(SlackPromptProvider);
  await Promise.all([
    slackApp.run(),
    prompt
      .select(
        "Select import source",
        IMPORT_SOURCES.map((src) => ({ title: src, value: src }))
      )
      .then((source) => new Logger("dev").info(source)),
  ]);
}

/* eslint-enable */
