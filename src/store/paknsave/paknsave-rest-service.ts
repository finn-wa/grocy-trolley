import { buildUrl } from "@grocy-trolley/utils/fetch-utils";
import { headers, HeadersBuilder } from "@grocy-trolley/utils/headers-builder";
import { PakNSaveAuthService, PAKNSAVE_URL } from ".";

export abstract class PakNSaveRestService {
  constructor(protected readonly pnsAuthService: PakNSaveAuthService) {}

  protected authHeaders(): HeadersBuilder {
    return headers().cookie(this.pnsAuthService.cookie);
  }

  protected buildUrl(path: string, params?: Record<string, string>): string {
    return buildUrl(PAKNSAVE_URL, path, params);
  }
}
