import Ajv, { SchemaObject } from "ajv/dist/jtd";
import { BodyParser, jtdParser } from "./rest";

export const ajv = new Ajv();

export interface RestSerialisers<T> {
  parser: BodyParser<T>;
  serialiser: (data: T) => string;
}

export function ajvCompile<T>(schema: SchemaObject): RestSerialisers<T> {
  return {
    parser: jtdParser(ajv.compileParser<T>(schema)),
    serialiser: ajv.compileSerializer(schema),
  };
}
