import { closeBrowser, getBrowser } from "@gt/store/shared/rest/browser";
import { Browser } from "playwright";
import { StoreContents } from "./grocer-indexed-db";
import { GrocerUserAgent } from "./grocer-user-agent";

describe("GrocerUserAgent", () => {
  let browser: Browser;
  let userAgent: GrocerUserAgent;
  const selectedStoreIds = [6340712107624913, 7644797357623558, 4567002660615265];

  beforeAll(async () => {
    browser = await getBrowser({ headless: true });
    userAgent = new GrocerUserAgent(() => Promise.resolve(browser));
  });

  beforeEach(async () => {
    await userAgent.resetKeyvalStore();
  });

  afterAll(closeBrowser);

  test("reset store contents", async () => {
    // method is called in beforeEach
    expect(await userAgent.getKeyvalStore()).toEqual({ list: [] });
  });

  test("patch store contents", async () => {
    await userAgent.patchKeyvalStore({ selectedStoreIds });
    const contents = await userAgent.getKeyvalStore();
    expect(contents).toEqual({ selectedStoreIds, list: [] });
  });

  test("put store contents", async () => {
    const newContents: StoreContents = {
      selectedStoreIds,
      list: [
        {
          id: 3478877474304321,
          quantity: 1,
          isChecked: false,
        },
        {
          id: 8830605499236404,
          quantity: 2,
          isChecked: true,
        },
      ],
    };
    await userAgent.putKeyvalStore(newContents);
    const contents = await userAgent.getKeyvalStore();
    expect(contents).toEqual(newContents);
  });
});
