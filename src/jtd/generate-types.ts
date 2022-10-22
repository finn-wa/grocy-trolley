import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { jtdCodegen } from "./codegen";
import { jtdInfer } from "./infer";
import dedent from "dedent";
import { Logger, prettyPrint } from "@gt/utils/logger";

/**
 * Generates the contents of a TypeScript file defining a JTD schema and associated validation functions.
 * @param type name for the schema type
 * @param ajvKey key for AJV schema
 * @param jtd JSON Type Definition (schema)
 * @param arrayType true if a schema should also be generated for `type[]`
 * @returns contents of the schema file as a string
 */
function generateSchemaFile(type: string, ajvKey: string, jtd: string, arrayType = false): string {
  let out = dedent`
    import { ajv, getRequiredSchema } from "@gt/jtd/ajv";
    import { JTDSchemaType } from "ajv/dist/jtd";
    import { ${type} } from ".";

    /**
     * This will cause a TypeScript compiler error if the ${type} type defined in
     * index.ts is modified in a way that makes it incompatible with the schema.
     */
    export const schema: JTDSchemaType<${type}> = ${jtd};

    /**
     * The key used to index the ${type} schema with ajv
     */
    export const key = "${ajvKey}/${type}";
  `;
  if (arrayType) {
    out += dedent`\n
      /**
       * The key used to index the ${type}[] schema with ajv
       */
      export const arrayKey = key + '[]'
    `;
  }
  out += dedent`\n
    /**
     * Calls {@link ajv.getSchema} with the ${type} schema {@link key}. The schema is
     * compiled on the first call to  {@link ajv.getSchema}.
     *
     * @returns A validate() function for ${type}
     */
    export const get${type}Schema = () => getRequiredSchema<${type}>(key);
  `;
  if (arrayType) {
    out += dedent`\n
      /**
       * Calls {@link ajv.getSchema} with the ${type}s schema {@link arrayKey}. The schema is
       * compiled on the first call to  {@link ajv.getSchema}.
       *
       * @returns A validate() function for an array of ${type}s
       */
      export const get${type}sSchema = () => getRequiredSchema<${type}[]>(arrayKey);
    `;
  }
  out += dedent`\n
    // Register schema${arrayType ? "s" : ""} with ajv
    ajv.addSchema(schema, key);
  `;
  if (arrayType) {
    out += dedent`\n
      ajv.addSchema({ elements: schema }, arrayKey);
    `;
  }
  return out + "\n";
}

const generateSchemaSpecFile = (type: string): string => dedent`
  import { testSchemaWithSamples } from "@gt/jtd/test-utils";
  import { describe } from "vitest";
  import samples from "./samples.json";
  import { get${type}Schema } from "./schema";

  describe("[internal] ${type} Schema", () => {
    const validate = get${type}Schema();
    testSchemaWithSamples(validate, samples);
  });
`;

/**
 * Generates code that can be used to re-run code generation. For use in development when a schema changes.
 * @param type name of schema type
 * @param sourceDir target directory for generated files
 * @param arrayType whether an array type schema (type[]) should also be generated
 * @returns the contents of a generate-schema.ts file
 */
const generateGenerateSchemaFile = (
  type: string,
  sourceDir: string,
  arrayType = false
): string => dedent`
  import { generateTypes } from "@gt/jtd/generate-types";
  import samples from "./samples.json";

  /**
   * Development tool - regenerates schema code based on samples.json, replacing the
   * contents of this folder. Use when the schema changes.
   */
  export async function regenerate${type}Schema() {
    return generateTypes(
      {
        typeName: "${type}",
        sourceDir: "${sourceDir}",
        generateArrayType: ${arrayType},
      },
      ...samples
    );
  }
`;

export async function generateTypes(
  {
    typeName,
    sourceDir,
    generateArrayType,
  }: {
    typeName: string;
    sourceDir: string;
    generateArrayType?: boolean;
  },
  ...inputs: unknown[]
) {
  const logger = new Logger("GenerateTypes");
  logger.info(`Generating ${typeName} schema...`);
  const typesDir = join(sourceDir, "types", typeName);
  await mkdir(typesDir, { recursive: true });
  // Infer JTD and save as schema
  const inferredJTD = JSON.stringify(jtdInfer<unknown>(...inputs));
  await Promise.all([
    // Save raw JSON files as samples
    writeFile(join(typesDir, "samples.json"), prettyPrint(inputs)),
    // Write spec file
    writeFile(join(typesDir, "schema.spec.ts"), generateSchemaSpecFile(typeName)),
    // Write generate file
    writeFile(
      join(typesDir, "generate-schema.ts"),
      generateGenerateSchemaFile(typeName, sourceDir, generateArrayType)
    ),
    // Generate code and save as index.ts
    jtdCodegen(typeName, inferredJTD, typesDir),
    // Write typecheck file
    writeFile(
      join(typesDir, "schema.ts"),
      generateSchemaFile(typeName, sourceDir, inferredJTD, generateArrayType)
    ),
  ]);
  logger.info(`Output schema files to ${sourceDir}/${typeName}`);
}
