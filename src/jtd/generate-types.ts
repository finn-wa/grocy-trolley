import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { jtdCodegen } from "./codegen";
import { jtdInfer } from "./infer";

const generateTypecheckFile = (type: string, jtd: string): string => `
import { compileSchema } from "@gt/jtd/ajv";
import { JTDSchemaType } from "ajv/dist/core";
import { ${type} } from ".";

/**
 * This will cause a TypeScript compiler error if the Order type defined in
 * index.ts is modified in a way that makes it incompatible with the schema.
 */
const schema: JTDSchemaType<${type}> = ${jtd};
export default schema;

export const ${type}Schema = compileSchema<${type}>(schema);
`;

const generateSchemaSpecFile = (type: string): string => `
import { describeSchema } from "@gt/jtd/test-utils";
import samples from "./samples.json";
import { ${type}Schema } from "./schema";

/** Ensures the schema matches the samples */
describeSchema("${type}Schema", ${type}Schema, samples);
`;

export async function generateTypes(
  methodName: string,
  typeName: string,
  sourceDir: string,
  ...inputs: unknown[]
) {
  const typesDir = join(sourceDir, "types", methodName);
  await mkdir(typesDir, { recursive: true });
  const writeStaticFiles = Promise.all([
    // Save raw JSON files as samples
    writeFile(join(typesDir, "samples.json"), JSON.stringify(inputs)),
    // Write spec file
    writeFile(join(typesDir, "schema.spec.ts"), generateSchemaSpecFile(typeName)),
  ]);
  // Infer JTD and save as schema
  const inferredJTD = JSON.stringify(jtdInfer<unknown>(...inputs));
  return Promise.all([
    writeStaticFiles,
    // Generate code and save as index.ts
    jtdCodegen(typeName, inferredJTD, typesDir),
    // Write typecheck file
    writeFile(join(typesDir, "schema.ts"), generateTypecheckFile(typeName, inferredJTD)),
  ]);
}
