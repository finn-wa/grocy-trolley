import fetch from "node-fetch";
import { extractJson } from "@grocy-trolley/utils/fetch-utils";
import { PAKNSAVE_URL } from "./paknsave.model";

export class PakNSaveAuthService {
  readonly loginUrl = `${PAKNSAVE_URL}/Account/Login`;
  loggedIn: boolean = false;
  cookie: string | null = null;
  private _userProfile: UserProfile | null = null;

  constructor(readonly email: string, private readonly password: string) {}

  async login(): Promise<LoginResponse> {
    const requestBody = { email: this.email, password: this.password };
    const response = await fetch(this.loginUrl, {
      method: "POST",
      body: JSON.stringify(requestBody),
    });
    const body: LoginResponse = await extractJson(response);
    if (!body.success || !body.userProfile) {
      throw new Error(`PakNSave login unsuccessful: '${JSON.stringify(body)}'`);
    }

    const cookieHeaders = response.headers.raw()["set-cookie"];
    if (!cookieHeaders) {
      throw new Error(
        `No cookies found in PakNSave login response headers: '${response.headers.raw()}'`
      );
    }
    this.cookie = cookieHeaders //
      .map((cookie) => cookie.slice(0, cookie.indexOf(";")))
      .join("; ");

    this._userProfile = body.userProfile;
    this.loggedIn = true;
    return body;
  }

  get userProfile(): UserProfile | null {
    return !!this._userProfile ? { ...this._userProfile } : null;
  }
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserProfile {
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
  userProfile: UserProfile;
}
