import { Browser, firefox } from "playwright";
import { LogLevel, playwrightLogger } from "@gt/utils/logger";

export let browser: Browser | null = null;

/**
 * Returns a lazy-loaded shared browser instance.
 * @returns The browser instance
 */
export async function getBrowser({ headless } = { headless: true }): Promise<Browser> {
  if (browser && browser.isConnected()) {
    return browser;
  }
  const logger = playwrightLogger(LogLevel.WARN);
  browser = await firefox.launch({ headless, logger });
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

/**
 * For use with tsyringe, like getBrowser but you can define whether it'll be
 * headless or not in advance.
 */
export function browserFactory(config: { headless: boolean }) {
  return () => getBrowser(config);
}
