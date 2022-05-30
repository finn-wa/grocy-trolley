import { ValidateFunction } from "ajv";
import { throwIfInvalid } from "./ajv";

export function expectSchemaToValidate<T>(validator: ValidateFunction<T>, data: T) {
  throwIfInvalid(validator, data);
}

export function testSchemaWithSamples<T>(validator: ValidateFunction<T>, samples: T[]) {
  return test.each(samples)("should validate sample %#", (sample) => {
    expectSchemaToValidate(validator, sample);
  });
}
