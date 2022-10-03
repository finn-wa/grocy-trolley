import "@abraham/reflection";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { configDefaults } from "vitest/config";

export default defineConfig({
  // esbuild: {
  //   format: "cjs",
  //   logLevel: "info",
  //   platform: "node",
  //   sourcemap: false,
  // },
  plugins: [tsconfigPaths({ projects: ["tsconfig.json"] })],
  test: {
    setupFiles: ["src/test/setup.ts"],
    exclude: [...configDefaults.exclude, "build"],
  },
});
