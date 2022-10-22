import { AppTokens } from "@gt/app/di";
import { PromptProvider } from "@gt/prompts/prompt-provider";
import { CacheService } from "@gt/utils/cache";
import { inject, Lifecycle, scoped } from "tsyringe";
import { GrocerApiService } from "../api/grocer-api-service";
import {
  GrocerVendorCode,
  GROCER_VENDOR_CODES,
  GROCER_VENDOR_CODE_MAP,
  Store,
} from "./types/Stores";

@scoped(Lifecycle.ContainerScoped)
export class GrocerStoreService {
  private readonly cache = new CacheService<{ stores: Store[] }>("grocer");

  constructor(
    private readonly api: GrocerApiService,
    @inject("PromptProvider") private readonly prompt: PromptProvider
  ) {}

  getStores = () => this.api.getStores();

  async promptForVendor(): Promise<GrocerVendorCode | null> {
    return this.prompt.select(
      "Select vendor",
      GROCER_VENDOR_CODES.map((code) => ({
        value: code,
        title: GROCER_VENDOR_CODE_MAP[code],
      }))
    );
  }

  async promptForStore(): Promise<Store | null> {
    const stores = await this.getStores();
    const vendor = await this.promptForVendor();
    if (!vendor) {
      return null;
    }
    return this.prompt.select(
      "Select store",
      stores
        .filter((store) => store.vendor_code === vendor)
        .map((store) => ({ value: store, title: store.name }))
    );
  }

  async promptForStores(): Promise<Store[] | null> {
    const cachedStores = await this.cache.get("stores");
    if (cachedStores) {
      const confirm = await this.prompt.confirm(
        `Use stored stores?\n\n${cachedStores.map((s) => s.name).join("\n")}\n`
      );
      if (confirm) {
        return cachedStores;
      }
    }
    const stores = await this.api.getStores();
    const selectedStores = await this.prompt.multiselect(
      "Select stores",
      stores.map((store) => ({ value: store, title: store.name }))
    );
    if (!selectedStores) {
      return null;
    }
    if (selectedStores.length > 0) {
      await this.cache.set("stores", selectedStores);
    }
    return selectedStores;
  }

  async getCachedStores(): Promise<Store[] | null> {
    return this.cache.get("stores");
  }
}
