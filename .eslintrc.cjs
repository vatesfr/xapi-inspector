"use strict";

module.exports = {
  extends: [
    // standard configuration
    "standard",

    // https://github.com/mysticatea/eslint-plugin-n#-rules
    "plugin:n/recommended",

    // disable rules handled by prettier
    "prettier",
  ],

  overrides: [
    { files: ["*.mjs"], parserOptions: { sourceType: "module" } },
    { files: ["*.cjs"], parserOptions: { sourceType: "script" } },
  ],

  parserOptions: { ecmaVersion: 2020 },

  reportUnusedDisableDirectives: true,

  rules: {
    // uncomment if you are using a builder like Babel
    // "n/no-unsupported-features/es-syntax": "off",

    strict: "error",
  },
};
