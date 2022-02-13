import { buildUrl, extractJson, post } from "@grocy-trolley/utils/fetch-utils";
import { headers } from "@grocy-trolley/utils/headers-builder";

export class FoodstuffsAuthService {
  loggedIn: boolean = false;
  private _cookie: string | null = null;
  private _userProfile: FoodstuffsUserProfile | null = null;

  constructor(
    readonly baseUrl: string,
    readonly email: string,
    private readonly password: string
  ) {}

  async login(): Promise<LoginResponse> {
    const response = await post(
      buildUrl(this.baseUrl, "Account/Login"),
      headers().contentTypeJson().acceptJson().build(),
      { email: this.email, password: this.password }
    );
    const body: LoginResponse = await extractJson(response);
    const cookieHeaders = response.headers.raw()["set-cookie"];
    if (!cookieHeaders) {
      throw new Error(
        `No cookies found in Foodstuffs login response headers: '${response.headers.raw()}'`
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
    return !!this._userProfile ? { ...this._userProfile } : null;
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
