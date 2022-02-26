import { getEnv } from "@grocy-trolley/env";
import { headers } from "@grocy-trolley/utils/headers-builder";
import { Logger, prettyPrint } from "@grocy-trolley/utils/logger";
import { RestService } from "@grocy-trolley/utils/rest";
import { PAKNSAVE_URL } from ".";

export class FoodstuffsAuthService extends RestService {
  loggedIn = false;
  protected readonly logger = new Logger(this.constructor.name);
  private _cookie: string | null = null;
  private _userProfile: FoodstuffsUserProfile | null = null;
  private readonly email: string = getEnv().PAKNSAVE_EMAIL;
  private readonly password = getEnv().PAKNSAVE_PASSWORD;

  constructor(readonly baseUrl: string = PAKNSAVE_URL) {
    super();
  }

  async login(): Promise<LoginResponse> {
    const response = await this.post(
      this.buildUrl("Account/Login"),
      headers().contentTypeJson().acceptJson().build(),
      { email: this.email, password: this.password }
    );
    const body = (await this.extractJson(response)) as LoginResponse;
    const cookieHeaders = response.headers.raw()["set-cookie"];
    if (!cookieHeaders) {
      throw new Error(
        `No cookies found in Foodstuffs login response headers: '${prettyPrint(
          response.headers.raw()
        )}'`
      );
    }
    // Remove duplicate cookies (Foodstuffs currently duplicates SessionCookieIdV2)
    this._cookie = [...new Set(cookieHeaders)]
      .map((cookie) => cookie.slice(0, cookie.indexOf(";")))
      .join("; ");

    this._userProfile = body.userProfile;
    this.loggedIn = true;
    return body;
  }

  get userProfile(): FoodstuffsUserProfile | null {
    return this._userProfile ? { ...this._userProfile } : null;
  }

  get cookie(): string {
    if (this._cookie === null) {
      throw new Error("Cannot provide cookie, user is not logged in");
    }
    return this._cookie;
  }
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface FoodstuffsUserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  agreedToMarketing: boolean;
  agreedToTermsAndConditions: boolean;
  clubCardUser: boolean;
}

export interface LoginResponse {
  success: boolean;
  userProfile: FoodstuffsUserProfile;
}
