module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true
  },
  parser: "babel-eslint",
  extends: ["eslint:recommended", "prettier"],
  rules: {
    quotes: ["error", "double"],
    semi: ["error", "always"],
    "prettier/prettier": [
      "error",
      {
        trailingComma: "es5",
        singleQuote: false,
        printWidth: 120
      }
    ]
  },
  plugins: ["prettier"]
};
