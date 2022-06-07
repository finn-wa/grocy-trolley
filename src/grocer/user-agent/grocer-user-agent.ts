import { StoreUserAgent } from "@gt/store/shared/rest/store-user-agent";
import { Logger } from "@gt/utils/logger";
import { Browser, BrowserContext, Page } from "playwright";
import { getIDBStoreAsObject } from "./get-idb-store-script";
import { GrocerStoreName, GROCER_STORE_BRANDS, GROCER_URL } from "../models";

/**
 * Currently unused.
 */
export class GrocerUserAgent extends StoreUserAgent {
  public readonly storeName = "grocer";
  protected readonly logger = new Logger(this.constructor.name);

  constructor(browserLoader: () => Promise<Browser>) {
    super(browserLoader);
  }

  async init(context: BrowserContext): Promise<{ page: Page; headers: Headers }> {
    const page = await context.newPage();
    throw new Error("method unimplemented");
  }

  /**
   * Adds store to selected stores (if it is not already selected).
   * @param page Playwright page
   * @param storeName Store name
   */
  async selectStore(page: Page, storeName: GrocerStoreName): Promise<void> {
    const url = `${GROCER_URL}/stores`;
    if (page.url() !== url) {
      await page.goto(url);
    }
    const storeSelector = `.list-group-item:has-text("${storeName}")`;
    // Check whether store is already selected
    const isSelected = await page.locator(storeSelector).count();
    if (!!isSelected) {
      this.logger.debug(`Store ${storeName} is already selected`);
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

  async getKeyvalStore(): Promise<GrocerKeyvalStore> {
    const page = await this.getLoginPage();
    return page.evaluate(getIDBStoreAsObject as () => Promise<GrocerKeyvalStore>);
  }
}

export interface GrocerKeyvalStore {
  list: unknown[];
  selectedStoreIds: number[];
}
