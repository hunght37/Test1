import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  ADMIN_PASSWORD: z.string().optional(),
  ADMIN_PASSWORD_HASH: z.string().optional(),
  ADMIN_SESSION_SECRET: z
    .string()
    .min(16, "ADMIN_SESSION_SECRET phải có ít nhất 16 ký tự")
    .default("dev-local-session-secret-change-me-in-production"),
  TMDB_API_KEY: z.string().default(""),
  NEXT_PUBLIC_SITE_URL: z.string().default("http://localhost:3000"),
  NEXT_PUBLIC_SITE_NAME: z.string().default("SubViet Portal"),
});

const parsed = envSchema.safeParse(process.env);

export const env = parsed.success
  ? parsed.data
  : {
      DATABASE_URL: process.env.DATABASE_URL ?? "",
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
      ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
      ADMIN_SESSION_SECRET:
        process.env.ADMIN_SESSION_SECRET ??
        "dev-local-session-secret-change-me-in-production",
      TMDB_API_KEY: process.env.TMDB_API_KEY ?? "",
      NEXT_PUBLIC_SITE_URL:
        process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      NEXT_PUBLIC_SITE_NAME:
        process.env.NEXT_PUBLIC_SITE_NAME ?? "SubViet Portal",
    };
