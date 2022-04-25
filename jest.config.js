// /** @type {import('@swc/core/types').Options} */
const swcOptions = {
  jsc: {
    target: "es2022",
    // baseUrl: "src",
  },
};

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  //   transform: {
  //     "^.+\\.(t|j)sx?$": ["@swc-node/jest", swcOptions],
  //   },
  preset: "ts-jest",
  testEnvironment: "node",

  // testNamePattern: "src/.*\\.spec\\.ts",
  testMatch: ["<rootDir>/src/**/*.spec.ts"],
  //   moduleDirectories: ["node_modules", "src"],
  moduleNameMapper: {
    "^@gt/(.*)$": "<rootDir>/src/$1",
  },
  // d
  // Required to use Node 18 experimental built-in fetch
  globals: {
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
};
