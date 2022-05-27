const fs = require("fs");
const { pathsToModuleNameMapper } = require("ts-jest");

const tsconfig = JSON.parse(fs.readFileSync("tsconfig.json", { encoding: "utf-8" }));

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  moduleNameMapper: pathsToModuleNameMapper(tsconfig.compilerOptions.paths, {
    prefix: "<rootDir>/src/",
  }),
  testTimeout: 60000,
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/*.spec.ts"],
  globals: {
    "ts-jest": { isolatedModules: true },
    // Required to use Node 18 experimental built-in fetch
    fetch,
    FormData,
    Blob,
    WritableStreamDefaultWriter,
    WritableStream,
    ReadableStream,
    Headers,
    Request,
    Response,
  },
  testEnvironment: "./jest-env",
  clearMocks: true,
};
