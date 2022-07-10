import prompts from "prompts";
import { GrocerApiService } from "../api/grocer-api-service";
import {
  GrocerVendorCode,
  GROCER_VENDOR_CODES,
  GROCER_VENDOR_CODE_MAP,
  Store,
} from "./types/Stores";

export class GrocerStoreService {
  constructor(private readonly api = new GrocerApiService()) {}
  getStores = () => this.api.getStores();

  async promptForStore(): Promise<Store> {
    const stores = await this.getStores();
    const response = (await prompts([
      {
        type: "select",
        name: "brand",
        message: "Select brand",
        choices: GROCER_VENDOR_CODES.map((code) => ({
          value: code,
          title: GROCER_VENDOR_CODE_MAP[code],
        })),
      },
      {
        type: "select",
        name: "store",
        message: "Select store",
        choices: (vendorCode) =>
          stores
            .filter((store) => store.vendor_code === vendorCode)
            .map((store) => ({ value: store, title: store.name })),
      },
    ])) as { store: Store; brand: GrocerVendorCode };
    return response.store;
  }

  async promptForStores(): Promise<Store[]> {
    const stores = await this.api.getStores();
    const response = (await prompts({
      type: "autocompleteMultiselect",
      name: "stores",
      message: "Select stores",
      choices: stores.map((store) => ({ value: store, title: store.name })),
    })) as { stores: Store[] };
    return response.stores;
  }
}
