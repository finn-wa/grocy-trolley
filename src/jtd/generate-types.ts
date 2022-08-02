import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { jtdCodegen } from "./codegen";
import { jtdInfer } from "./infer";
import dedent from "dedent";
import { prettyPrint } from "@gt/utils/logger";

function generateSchemaFile(
  type: string,
  schemaKey: string,
  jtd: string,
  arrayType = false
): string {
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
    export const key = "${schemaKey}";
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
    out += dedent`
      ajv.addSchema({ elements: schema }, arrayKey);
    `;
  }
  return out;
}

const generateSchemaSpecFile = (type: string): string => dedent`
  import { testSchemaWithSamples } from "@gt/jtd/test-utils";
  import samples from "./samples.json";
  import { get${type}Schema } from "./schema";

  describe("${type} Schema", () => {
    const validate = get${type}Schema();
    testSchemaWithSamples(validate, samples);
  });
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
  const typesDir = join(sourceDir, "types", typeName);
  await mkdir(typesDir, { recursive: true });
  // Infer JTD and save as schema
  const inferredJTD = JSON.stringify(jtdInfer<unknown>(typeName, ...inputs));
  return Promise.all([
    // Save raw JSON files as samples
    writeFile(join(typesDir, "samples.json"), prettyPrint(inputs)),
    // Write spec file
    writeFile(join(typesDir, "schema.spec.ts"), generateSchemaSpecFile(typeName)),
    // Generate code and save as index.ts
    jtdCodegen(typeName, inferredJTD, typesDir),
    // Write typecheck file
    writeFile(
      join(typesDir, "schema.ts"),
      generateSchemaFile(typeName, `${sourceDir}/${typeName}`, inferredJTD, generateArrayType)
    ),
  ]);
}
