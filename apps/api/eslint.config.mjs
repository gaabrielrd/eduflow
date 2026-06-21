import nodeApiConfig from "@eduflow/eslint-config/node-api";

export default [
  ...nodeApiConfig,
  {
    ignores: ["dist/**"]
  }
];
