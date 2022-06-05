import path from "path";
import { Page } from "playwright";
import { pathSafeDate } from "./date";

/**
 * Saves a screenshot of the page's current state to a file in the temp directory.
 * @param page Playwright page
 * @param errorTitle Error message to use as screenshot filename prefix
 * @returns File save path
 */
export async function saveErrorScreenshot(page: Page, errorTitle: string) {
  const savePath = path.join("temp", "playwright-errors", `${errorTitle}_${pathSafeDate()}.png`);
  await page.screenshot({ path: savePath });
  return savePath;
}
