/* eslint-disable */
import "@abraham/reflection";
import { container } from "tsyringe";
import { registerAppDependencies } from "./app";
import { GrocyTrolleySlackBot } from "./slack/gt-slack-bot";

export async function dev() {
  registerAppDependencies(container);

  const slackApp = container.resolve(GrocyTrolleySlackBot);

  await slackApp.run();
}

/* eslint-enable */
