/** Jest configuration for the TypeScript M2 validation suites. */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  // Relative glob, not "<rootDir>/tests/**\/*.test.ts".
  //
  // On Windows, `<rootDir>` expands with backslashes and the remainder of the
  // pattern is written with forward slashes, producing a mixed-separator glob
  // such as `C:/Users/user\.cline/data/...`. micromatch cannot match that, so
  // Jest silently reported "No tests found" and exited 1 — the suite looked
  // broken rather than empty. A relative pattern is separator-agnostic and
  // resolves the same way on every platform.
  testMatch: ["**/tests/**/*.test.ts"],
  // Keep the AI governance suite out of the M2/Jest run: it is written for
  // Vitest (see vitest.config.ts and `npm run test:vitest`).
  testPathIgnorePatterns: ["/node_modules/", "[\\\\/]tests[\\\\/]ai[\\\\/]"],
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: { module: "CommonJS", jsx: "react-jsx" } }],
  },
};
