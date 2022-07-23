import { CacheService, getCacheDir } from "@gt/utils/cache";
import path from "path";
import prompts from "prompts";
import { GrocerApiService } from "../api/grocer-api-service";
import {
  GrocerVendorCode,
  GROCER_VENDOR_CODES,
  GROCER_VENDOR_CODE_MAP,
  Store,
} from "./types/Stores";

export class GrocerStoreService {
  private readonly cache = new CacheService<{ stores: Store[] }>("grocer");

  constructor(private readonly api = new GrocerApiService()) {}

  getStores = () => this.api.getStores();

  async promptForVendor(): Promise<GrocerVendorCode> {
    const response = await prompts({
      type: "select",
      name: "vendor",
      message: "Select vendor",
      choices: GROCER_VENDOR_CODES.map((code) => ({
        value: code,
        title: GROCER_VENDOR_CODE_MAP[code],
      })),
    });
    return response.vendor as GrocerVendorCode;
  }

  async promptForStore(): Promise<Store> {
    const stores = await this.getStores();
    const vendor = await this.promptForVendor();
    const response = await prompts({
      type: "select",
      name: "store",
      message: "Select store",
      choices: () =>
        stores
          .filter((store) => store.vendor_code === vendor)
          .map((store) => ({ value: store, title: store.name })),
    });
    return response.store as Store;
  }

  async promptForStores(): Promise<Store[]> {
    const cachedStores = await this.cache.get("stores");
    if (cachedStores) {
      const confirm = await prompts({
        type: "confirm",
        message: `Use stored stores?\n\n${cachedStores.map((s) => s.name).join("\n")}\n`,
        name: "useCached",
      });
      if (confirm.useCached) {
        return cachedStores;
      }
    }
    const stores = await this.api.getStores();
    const response = await prompts({
      type: "autocompleteMultiselect",
      name: "stores",
      message: "Select stores",
      choices: () => stores.map((store) => ({ value: store, title: store.name })),
    });
    const selectedStores = response.stores as Store[];
    if (selectedStores.length > 0) {
      await this.cache.set("stores", selectedStores);
    }
    return selectedStores;
  }
}
