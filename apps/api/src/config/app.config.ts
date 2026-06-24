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
    STORAGE_ENDPOINT: process.env.STORAGE_ENDPOINT,
    STORAGE_ACCESS_KEY: process.env.STORAGE_ACCESS_KEY,
    STORAGE_SECRET_KEY: process.env.STORAGE_SECRET_KEY,
    STORAGE_BUCKET_NAME: process.env.STORAGE_BUCKET_NAME,
    STORAGE_REGION: process.env.STORAGE_REGION,
    STORAGE_PUBLIC_BASE_URL: process.env.STORAGE_PUBLIC_BASE_URL
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

export function getStorageConfig() {
  const {
    STORAGE_ACCESS_KEY,
    STORAGE_BUCKET_NAME,
    STORAGE_ENDPOINT,
    STORAGE_PUBLIC_BASE_URL,
    STORAGE_REGION,
    STORAGE_SECRET_KEY
  } = parseEnv();

  return {
    endpoint: STORAGE_ENDPOINT,
    accessKey: STORAGE_ACCESS_KEY,
    secretKey: STORAGE_SECRET_KEY,
    bucketName: STORAGE_BUCKET_NAME,
    region: STORAGE_REGION,
    publicBaseUrl: STORAGE_PUBLIC_BASE_URL
  };
}
