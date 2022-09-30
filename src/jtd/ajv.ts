import { Logger, prettyPrint as pp } from "@gt/utils/logger";
import Ajv, { ValidateFunction } from "ajv/dist/jtd";

export const ajv = new Ajv();
ajv.addKeyword("typescriptType");

/**
 * Calls {@link ajv.getSchema} with the specified key. Ensures the returned
 * {@link ValidateFunction} is truthy before returning it.
 * @param key The key associated with the schema (used with {@link ajv.addSchema})
 * @returns The validate() function for the schema
 * @throws if the schema has not been registered
 */
export function getRequiredSchema<T>(key: string): ValidateFunction<T> {
  const schema = ajv.getSchema<T>(key);
  if (!schema) {
    throw new Error(`Schema ${key} is not registered with ajv`);
  }
  return schema;
}

/** Formats an error message for the validate function */
export function validationErrorMsg<T>(validate: ValidateFunction<T>, data?: T): string {
  return `Error validating JSON\n${data ? pp(data) : ""}\n${pp(validate.errors)}`;
}

export function throwIfInvalid<T>(validate: ValidateFunction<T>, data: T): T {
  if (validate(data)) {
    return data;
  }
  throw new Error(validationErrorMsg(validate, data));
}

export function warnIfInvalid<T>(logger: Logger, validate: ValidateFunction<T>, data: T): void {
  if (!validate(data)) {
    logger.warn(validationErrorMsg(validate, data));
  }
}
