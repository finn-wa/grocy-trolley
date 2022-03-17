import { getEnv } from "env";
import { readFile, writeFile } from "fs/promises";
import { headers } from "utils/headers-builder";
import { Logger, prettyPrint } from "utils/logger";
import { RestService } from "utils/rest";
import { PAKNSAVE_URL } from ".";

export class FoodstuffsAuthService extends RestService {
  readonly baseUrl: `${string}/`;

  loggedIn = false;
  protected readonly logger = new Logger(this.constructor.name);
  private _cookie: string | null = null;
  private readonly env = getEnv();
  private readonly email = this.env.PAKNSAVE_EMAIL;
  private readonly password = this.env.PAKNSAVE_PASSWORD;
  private readonly cookiesPath = "src/resources/cache/cookies.json";

  constructor() {
    super();
    this.baseUrl = this.validateBaseUrl(PAKNSAVE_URL);
  }

  get cookie(): string {
    if (this._cookie === null) {
      throw new Error("Cannot provide cookie, user is not logged in");
    }
    return this._cookie;
  }

  async login(): Promise<void> {
    const cache = await this.getCachedCookieHeaders();
    const cookieHeaders = cache === null ? await this.requestLoginCookieHeaders() : cache;
    this._cookie = this.toCookieRequestHeader(cookieHeaders);
    this.loggedIn = true;
  }

  async getCookieHeaders() {
    const cache = await this.getCachedCookieHeaders();
    return cache === null ? await this.requestLoginCookieHeaders() : cache;
  }

  private async getCachedCookieHeaders(): Promise<string[] | null> {
    try {
      const cookiesString = await readFile(this.cookiesPath, { encoding: "utf-8" });
      return JSON.parse(cookiesString);
    } catch (error) {
      this.logger.debug("No cached cookies found at " + this.cookiesPath);
      return null;
    }
  }

  private async requestLoginCookieHeaders(): Promise<string[]> {
    const response = await this.post(
      this.buildUrl("Account/Login"),
      headers().contentTypeJson().acceptJson().build(),
      { email: this.email, password: this.password }
    );
    const rawHeaders = response.headers.raw();
    const cookieHeaders = rawHeaders["set-cookie"];
    if (!cookieHeaders) {
      throw new Error(
        `No cookies found in Foodstuffs login response headers: '${prettyPrint(rawHeaders)}'`
      );
    }
    this.logger.debug(cookieHeaders);
    // Cache cookies
    await writeFile(this.cookiesPath, JSON.stringify(cookieHeaders));
    return cookieHeaders;
  }

  /**
   * Turns "set-cookie" response headers to a "cookie" request header value and
   * remove duplicate cookies (Foodstuffs currently duplicates SessionCookieIdV2).
   *
   * @param setCookie set-cookie header values
   * @returns cookie request header value
   */
  toCookieRequestHeader(setCookie: string[]): string {
    return [...new Set(setCookie)].map((cookie) => cookie.slice(0, cookie.indexOf(";"))).join("; ");
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
