import { ValidateFunction } from "ajv";
import { throwIfInvalid } from "./ajv";

export function testSchemaWithSamples<T>(validator: ValidateFunction<T>, samples: T[]) {
  return test.each(samples)("should validate sample %#", (sample) =>
    throwIfInvalid(validator, sample)
  );
}

export function expectSchemaToValidate<T>(validator: ValidateFunction<T>, data: T) {
  expect(() => throwIfInvalid(validator, data)).not.toThrow();
}
