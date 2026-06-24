import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),
  JWT_SECRET: z.string().min(1),
  JWT_ACCESS_TOKEN_EXPIRES_IN: z.string().min(1).default("1h"),
  JWT_REFRESH_TOKEN_EXPIRES_IN: z.string().min(1).default("30d"),
  STORAGE_ENDPOINT: z.url(),
  STORAGE_ACCESS_KEY: z.string().min(1),
  STORAGE_SECRET_KEY: z.string().min(1),
  STORAGE_BUCKET_NAME: z.string().min(1),
  STORAGE_REGION: z.string().min(1).default("us-east-1"),
  STORAGE_PUBLIC_BASE_URL: z.url()
});

export function validateEnv(config: Record<string, unknown>) {
  return envSchema.parse(config);
}
