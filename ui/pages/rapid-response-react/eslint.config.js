import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettier from "eslint-plugin-prettier";
import noRelativeImportPaths from "eslint-plugin-no-relative-import-paths";
import vitest from "@vitest/eslint-plugin";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      prettier,
      "no-relative-import-paths": noRelativeImportPaths,
      vitest,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...tseslint.configs["recommended-type-checked"].rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
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
      // Allow React as type-only import (React.MouseEvent, etc)
      "no-undef": "off",
    },
  },
  {
    ignores: ["vite.config.js", "tests/setup.ts", "dist/**"],
  },
];
