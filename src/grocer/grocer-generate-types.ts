import { getCacheDir } from "@gt/utils/cache";
import { Logger } from "@gt/utils/logger";
import { existsSync } from "fs";
import path from "path";
import { BrowserContext, firefox, Page } from "playwright";
import prompts from "prompts";
import { GrocerStoreName, GROCER_STORE_BRANDS, GROCER_URL } from "./models";

let logger: Logger;
function getLogger(): Logger {
  if (!logger) {
    logger = new Logger("GrocerGenerateTypes");
  }
  return logger;
}

function getStorageStatePath(): string {
  return path.join(getCacheDir(), "grocer", "playwright.json");
}

// TODO: Fetch stores from Grocy API
const stores: GrocerStoreName[] = [
  "Countdown Glenfield",
  "New World Mt Roskill",
  "PAK'nSAVE Royal Oak",
];

export async function getGrocerContext(): Promise<BrowserContext> {
  const browser = await firefox.launch({ headless: false });
  const storageState = getStorageStatePath();
  if (!existsSync(storageState)) {
    return browser.newContext({ baseURL: GROCER_URL });
  }
  return browser.newContext({ storageState, baseURL: GROCER_URL });
}

/**
 * Adds store to selected stores (if it is not already selected).
 * @param page Playwright page
 * @param storeName Store name
 */
async function selectStore(page: Page, storeName: GrocerStoreName): Promise<void> {
  const url = `${GROCER_URL}/stores`;
  if (page.url() !== url) {
    await page.goto(url);
  }
  const storeSelector = `.list-group-item:has-text("${storeName}")`;
  // Check whether store is already selected
  const isSelected = await page.locator(storeSelector).count();
  if (!!isSelected) {
    getLogger().debug(`Store ${storeName} is already selected`);
    return;
  }

  const brandTabSelector = "nav.nav-tabs a.nav-link";
  const brandTabs = page.locator(brandTabSelector);
  // Home tab contains the list of selected stores
  const count = await brandTabs.count();
  if (count < GROCER_STORE_BRANDS.length + 1) {
    throw new Error(`Selector ${brandTabSelector} only returned ${count} brand tabs`);
  }
  for (let n = 1; n < count; n++) {
    await brandTabs.nth(n).click();
    const store = page.locator(`${storeSelector.replace(/'/g, "\\'")} input[type=checkbox]`);
    if (await store.count()) {
      await store.check();
      return;
    }
  }
  throw new Error(`Could not find store ${storeName}`);
}

export async function setupGrocer() {
  const context = await getGrocerContext();
  const page = await context.newPage();
  await selectStore(page, stores[2]);
  await prompts({ type: "invisible", message: "exit?", name: "exit" });
  await context.storageState({ path: getStorageStatePath() });
}
