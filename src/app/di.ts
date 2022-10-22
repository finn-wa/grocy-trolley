import { CLIPromptProvider } from "@gt/prompts/cli-prompt-provider";
import { TaggunReceiptScanner } from "@gt/receipt-ocr/taggun/taggun-receipt-scanner";
import { createCacheService } from "@gt/utils/cache";
import { container, DependencyContainer, Provider, ValueProvider } from "tsyringe";
import { getBrowser } from "../store/shared/rest/browser";

/** App injection tokens */
export const AppTokens = {
  /** A new child container that can be safely reconfigured */
  childContainer: "ChildContainer",
  browserLoader: "BrowserLoader",
  promptProvider: "PromptProvider",
  receiptScanner: "ReceiptScanner",
  cacheServiceFactory: "CacheServiceFactory",
} as const;

export const defaultDependencies = {
  [AppTokens.childContainer]: { useFactory: () => container.createChildContainer() },
  [AppTokens.browserLoader]: { useValue: () => getBrowser({ headless: false }) },
  [AppTokens.promptProvider]: { useClass: CLIPromptProvider },
  [AppTokens.receiptScanner]: { useClass: TaggunReceiptScanner },
  [AppTokens.cacheServiceFactory]: { useValue: createCacheService },
} as const;

export function registerDependencies(
  dc: DependencyContainer,
  dependencies: Record<string, Provider<unknown>>
) {
  for (const [token, provider] of Object.entries(dependencies)) {
    dc.register(token, provider as ValueProvider<unknown>);
  }
}

/**
 * Registers the default dependencies for the application, including:
 * - app container (child container of @param dc)
 * - browser loader (firefox)
 * - prompt provider (CLI)
 * - receipt scanner (taggun)
 *
 * @param dc container to register dependencies into. Will also be used to create
 *    child containers.
 * @returns dc with dependencies registered
 */
export function registerDefaultDependencies(dc: DependencyContainer) {
  const dependencies: Record<string, Provider> = {
    ...defaultDependencies,
    [AppTokens.childContainer]: { useFactory: () => dc.createChildContainer() },
  };
  registerDependencies(dc, dependencies);
}
