import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.url()
});

export function validateEnv(config: Record<string, unknown>) {
  return envSchema.parse(config);
}
