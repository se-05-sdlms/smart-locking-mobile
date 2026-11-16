const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  ...expoConfig,
  {
    files: ["tests/**/*.test.cjs"],
    languageOptions: { globals: { __dirname: "readonly" } },
  },
  {
    ignores: ["dist/*", ".expo/*", "node_modules/*", "expo-env.d.ts", "uniwind-types.d.ts"],
  },
];
