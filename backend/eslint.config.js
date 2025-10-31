import js from "@eslint/js";
import globals from "globals";

export default [
  // Ignore patterns
  {
    ignores: ["node_modules/", "coverage/", "dist/"],
  },

  // Main configuration for all JS files
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "no-console": "off", // Allow console in backend
      "prefer-const": "error",
      "no-var": "error",
    },
  },

  // Test files configuration
  {
    files: ["__tests__/**/*.js", "**/*.test.js", "**/*.spec.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      "no-unused-expressions": "off",
    },
  },
];
