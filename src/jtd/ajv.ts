import Ajv, { JTDParser, SchemaObject, ValidateFunction } from "ajv/dist/jtd";
import { BodyParser, jtdParser } from "../utils/rest";

export const ajv = new Ajv();

export interface CompiledSchema<T> {
  readonly parse: JTDParser<T>;
  readonly parseResponse: BodyParser<T>;
  readonly serialise: (data: T) => string;
  readonly validate: ValidateFunction<T>;
}

export function compileSchema<T>(schema: SchemaObject): CompiledSchema<T> {
  const parse = ajv.compileParser<T>(schema);
  return {
    parse,
    parseResponse: jtdParser(parse),
    validate: ajv.compile(schema),
    serialise: ajv.compileSerializer(schema),
  };
}
