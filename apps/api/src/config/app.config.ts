import { envSchema } from "./env.schema.js";

export const appConfig = {
  serviceName: "eduflow-api" as const
};

function parseEnv() {
  return envSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_ACCESS_TOKEN_EXPIRES_IN: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN,
    JWT_REFRESH_TOKEN_EXPIRES_IN: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
    S3_SECRET_KEY: process.env.S3_SECRET_KEY
  });
}

export function getAppPort() {
  return parseEnv().PORT;
}

export function getDatabaseUrl() {
  return parseEnv().DATABASE_URL;
}

export function getRedisUrl() {
  return parseEnv().REDIS_URL;
}

export function getJwtConfig() {
  const {
    JWT_ACCESS_TOKEN_EXPIRES_IN,
    JWT_REFRESH_TOKEN_EXPIRES_IN,
    JWT_SECRET
  } = parseEnv();

  return {
    secret: JWT_SECRET,
    accessTokenExpiresIn: JWT_ACCESS_TOKEN_EXPIRES_IN,
    refreshTokenExpiresIn: JWT_REFRESH_TOKEN_EXPIRES_IN
  };
}

export function getS3Config() {
  const { S3_ACCESS_KEY, S3_ENDPOINT, S3_SECRET_KEY } = parseEnv();

  return {
    endpoint: S3_ENDPOINT,
    accessKey: S3_ACCESS_KEY,
    secretKey: S3_SECRET_KEY
  };
}
