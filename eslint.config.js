import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  {
    ignores: ["dist"],
    extends: [js.configs.recommended], // Use recommended rules from ESLint's core
    files: ["**/*.{js,jsx}"], // Types of flies batave which are to be linted
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser, // like window, document, etc.
        React: "readonly", // Add React global
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // Common JavaScript rules
      "no-unused-vars": "warn",
      "no-console": "warn",
      quotes: ["error", "single"],
      semi: ["error", "always"],
    },
  },
];
