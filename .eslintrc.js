module.exports = {
  parser: "vue-eslint-parser",
  parserOptions: {
    parser: "@typescript-eslint/parser",
  },
  plugins: ["prettier"],
  overrides: {
    extends: ["@nuxtjs/eslint-config-typescript", "plugin:prettier/recommended"],
    rules: {
      "import/order": "off",
      "require-await": "off",
      "vue/attribute-hyphenation": "off",
      "vue/v-on-event-hyphenation": "off",
      "vue/no-multiple-template-root": "off",
      "vue/no-template-shadow": "off",
    }
  }
};
