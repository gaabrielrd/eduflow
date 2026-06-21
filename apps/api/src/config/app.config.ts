import { envSchema } from "./env.schema.js";

export const appConfig = {
  serviceName: "eduflow-api" as const
};

function parseEnv() {
  return envSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL
  });
}

export function getAppPort() {
  return parseEnv().PORT;
}

export function getDatabaseUrl() {
  return parseEnv().DATABASE_URL;
}
