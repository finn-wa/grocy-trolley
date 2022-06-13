/* eslint-disable @typescript-eslint/unbound-method */
import { StoreUserAgent } from "@gt/store/shared/rest/store-user-agent";
import { Logger } from "@gt/utils/logger";
import { Browser, BrowserContext, Page } from "playwright";
import {
  getStoreContents,
  patchStoreContents,
  putStoreContents,
  StoreContents,
} from "./grocer-indexed-db";
import { GrocerStoreName, GROCER_STORE_BRANDS, GROCER_URL } from "../models";

/**
 * User agent that performs actions on the grocer.nz page using Playwright.
 */
export class GrocerUserAgent {
  private page?: Page;
  private readonly logger = new Logger(this.constructor.name);

  /**
   * Creates a new GrocerUserAgent.
   * @param browserLoader Cold promise that returns the Playwright Browser
   *    instance to use to perform requests.
   */
  constructor(protected readonly browserLoader: () => Promise<Browser>) {}

  /**
   * Adds store to selected stores (if it is not already selected).
   * @param page Playwright page
   * @param storeName Store name
   */
  async selectStore(page: Page, storeName: GrocerStoreName): Promise<void> {
    if (!page.url().includes(`${GROCER_URL}/stores`)) {
      await page.click('nav a[href="/stores"]');
    }
    const storeSelector = `.list-group-item:has-text("${storeName}")`;
    // Check whether store is already selected
    const isSelected = await page.locator(storeSelector).count();
    if (isSelected) {
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

  async getKeyvalStore(): Promise<StoreContents> {
    return this.getPage().then((page) => getStoreContents(page));
  }

  async patchKeyvalStore(contents: Partial<StoreContents>): Promise<void> {
    return this.getPage().then((page) => patchStoreContents(page, contents));
  }

  async putKeyvalStore(contents: StoreContents): Promise<void> {
    return this.getPage().then((page) => putStoreContents(page, contents));
  }

  async resetKeyvalStore(): Promise<void> {
    return this.putKeyvalStore({ list: [] });
  }

  private async getPage(): Promise<Page> {
    if (!this.page) {
      const browser = await this.browserLoader();
      this.page = await browser.newPage();
      await this.page.goto(GROCER_URL);
    }
    return this.page;
  }
}
