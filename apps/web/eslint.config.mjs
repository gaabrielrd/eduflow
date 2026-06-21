import nextWebConfig from "@eduflow/eslint-config/next-web";

export default [
  ...nextWebConfig,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@next/next/no-html-link-for-pages": "off"
    }
  },
  {
    ignores: ["dist/**"]
  }
];
