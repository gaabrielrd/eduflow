import baseConfig from "./base.js";
import tseslint from "typescript-eslint";

const nodeApiConfig = [
  ...baseConfig,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd()
      }
    },
    rules: {
      "no-console": "off"
    }
  }
];

export default nodeApiConfig;
