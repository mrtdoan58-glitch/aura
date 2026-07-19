import { z } from "zod";

/** Runtime env doğrulama — eksik/yanlış konfigürasyon erken yakalanır. */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url().optional(),
  AUTH_DRIVER: z.enum(["prisma", "memory"]).default("memory"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  RESEND_API_KEY: z.string().optional(),
  RESEND_EMAIL_DOMAIN: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;
export function getEnv(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error("Geçersiz ortam değişkenleri: " + JSON.stringify(parsed.error.flatten().fieldErrors));
  }
  cached = parsed.data;
  return cached;
}
