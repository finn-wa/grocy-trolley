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
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: ["<rootDir>/src/**/*.spec.ts"],
  clearMocks: true,
  reporters: [
    "default",
    [
      "./node_modules/jest-html-reporter",
      {
        pageTitle: "Test Report",
        outputPath: "./build/test-report.html",
        includeFailureMsg: true,
        includeConsoleLog: true,
      },
    ],
  ],
  globals: {
    "ts-jest": { isolatedModules: true, tsconfig: tsconfig.compilerOptions },
  },
};
