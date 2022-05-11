import { Browser, firefox } from "playwright-firefox";
import { LogLevel, playwrightLogger } from "@gt/utils/logger";

export let browser: Browser | null = null;

/**
 * Returns a lazy-loaded shared browser instance.
 * @returns The browser instance
 */
export async function getBrowser(): Promise<Browser> {
  if (browser && browser.isConnected()) {
    return browser;
  }
  browser = await firefox.launch({
    headless: false,
    logger: playwrightLogger(LogLevel.WARN),
  });
  return browser;
}
