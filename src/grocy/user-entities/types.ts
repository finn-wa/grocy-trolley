import { StoreBrand } from "../grocy-config";
import { GrocyBoolean } from "../types/grocy-types";

export interface UserEntity {
  id: string;
  name: string;
  caption: string;
  description: string;
  show_in_sidebar_menu: string;
  icon_css_class: string;
  row_created_timestamp: string;
}

export interface CreatedObjectResponse {
  response: Response;
  objectId: string;
}
/**
 * Returned from /api/objects/userobjects. Useful as a crossreference because
 * GET /objects/userentity-xxx is not exposed and user objects have to be
 * retrieved one at a time from /userfields/:entity/:objectId, which is fun.
 */

export interface UserObjectReference {
  userentity_id: string;
  id: string;
  row_created_timestamp: string;
}

export interface UserObjects extends Record<string, Record<string, string>> {
  order: {
    /** YYYY-MM-DD */
    date: string;
    brand: StoreBrand;
    imported: GrocyBoolean;
    orderId: string;
    notes?: string;
  };
}

export type UserEntityName = keyof UserObjects;
export type OrderRecord = UserObjects["order"];
