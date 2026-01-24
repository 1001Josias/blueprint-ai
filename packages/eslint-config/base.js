const tseslint = require("typescript-eslint");
const js = require("@eslint/js");

/** @type {import("eslint").Linter.Config[]} */
module.exports = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
      ignores: ["dist/**", ".turbo/**", "node_modules/**"]
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  }
);
