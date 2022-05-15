import { prettyPrint as pp } from "@gt/utils/logger";
import { CompiledSchema } from "./ajv";

export function describeSchema<T>(type: string, schema: CompiledSchema<T>, samples: T[]) {
  return describe(`${type}Schema`, () => {
    const serialisedSamples: [T, string][] = samples.map((s) => [s, JSON.stringify(s)]);

    test.each(serialisedSamples)("parse sample %#", (sample, serialised) =>
      expect(schema.parse(serialised)).toEqual(sample)
    );

    test.each(samples)("serialise sample %#", (sample) =>
      expect(JSON.parse(schema.serialise(sample))).toEqual(sample)
    );

    test.each(samples)("validate sample %#", (sample) => {
      expect(Array.isArray(sample)).toBe(false);
      if (!schema.validate(sample)) {
        throw new Error(`
${type} Validation failed for JSON:
${pp(sample)}

with error:
${pp(schema.validate.errors)}`);
      }
    });
  });
}
