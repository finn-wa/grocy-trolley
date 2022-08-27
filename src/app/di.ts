import { CLIPromptProvider } from "@gt/prompts/cli-prompt-provider";
import { DependencyContainer } from "tsyringe";
import { TaggunReceiptScanner } from "../receipt-ocr/taggun/taggun-receipt-scanner";
import { browserFactory } from "../store/shared/rest/browser";

/** App injection tokens */
export const AppTokens = {
  appContainer: "AppContainer",
  browserLoader: "BrowserLoader",
  promptProvider: "PromptProvider",
  receiptScanner: "ReceiptScanner",
  slackUserId: "SlackUserId",
} as const;

/**
 * Registers the default dependencies for the application, including:
 * - app container (child container of @param dc)
 * - browser loader (firefox)
 * - prompt provider (CLI)
 * - receipt scanner (taggun)
 *
 * @param dc container to register dependencies into
 * @returns dc with dependencies registered
 */
export function registerDefaultDependencies(dc: DependencyContainer) {
  return dc
    .register(AppTokens.appContainer, { useFactory: () => dc.createChildContainer() })
    .register(AppTokens.browserLoader, { useValue: browserFactory({ headless: false }) })
    .register(AppTokens.promptProvider, { useClass: CLIPromptProvider })
    .registerSingleton(AppTokens.receiptScanner, TaggunReceiptScanner);
}
