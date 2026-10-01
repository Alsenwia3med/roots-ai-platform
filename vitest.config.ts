import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["lib/ai/**/*.ts", "lib/assessment/**/*.ts"],
      exclude: ["lib/assessment/answer-types.ts", "lib/assessment/types.ts"],
      thresholds: { lines: 80, functions: 50, branches: 50, statements: 80 },
    },
  },
});
