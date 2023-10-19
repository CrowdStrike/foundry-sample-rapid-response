/* eslint-env node */

module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:react-hooks/recommended",
  ],
  settings: {
    react: {
      version: "detect",
    },
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: true,
    tsconfigRootDir: __dirname,
  },
  plugins: ["react-refresh", "prettier", "react", "no-relative-import-paths"],
  ignorePatterns: ["vite.config.js", "tests/setup.ts"],
  rules: {
    "prettier/prettier": "error",
    "react-refresh/only-export-components": [
      "off",
      { allowConstantExport: true },
    ],
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { varsIgnorePattern: "^_", argsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-misused-promises": [
      "error",
      { checksVoidReturn: { attributes: false } },
    ],
    "react/react-in-jsx-scope": "off",
    "no-relative-import-paths/no-relative-import-paths": [
      "warn",
      { allowSameFolder: false, prefix: "@", rootDir: "src" },
    ],
  },
};
