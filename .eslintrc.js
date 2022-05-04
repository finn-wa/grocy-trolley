/**@type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
    tsconfigRootDir: __dirname,
    project: ["tsconfig.json"],
  },
  rules: {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "_" }],
  },
  ignorePatterns: [".eslintrc.js", "node_modules/**", "scripts", "out", "*.d.ts"],
};
