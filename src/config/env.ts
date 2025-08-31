import { z } from "zod";
import dotenv from "dotenv";

dotenv.config({ debug: true });

const envSchema = z.object({
  ENV: z.enum(["dev", "production"]),
  PORT: z
    .string()
    .refine((val) => {
      const num = Number(val);
      return !isNaN(num) && num >= 1 && num <= 65535;
    }, { message: "PORT must be a number between 1 and 65535" }),

  DATABASE_URI_DEV: z.url(),
  DATABASE_URI_PROD: z.url(),
  DB_CONNECTION_INTERVAL: z
    .string()
    .transform((val) => Number(val))
    .refine((num) => !isNaN(num) && num > 0, {
      message: "DB_CONNECTION_INTERVAL must be a positive number (ms)",
    }),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

const env = parsed.data;

const databaseUri =
  env.ENV === "dev" ? env.DATABASE_URI_DEV : env.DATABASE_URI_PROD;

export const config = {
  env: env.ENV,
  port: Number(env.PORT),
  databaseUri,
  dbConnectionInterval: env.DB_CONNECTION_INTERVAL,
  constants: {
    APP_NAME: "MyApp",
    FIREWALL_IPS_TABLE: "firewall_ips",
    FIREWALL_URLS_TABLE: "firewall_urls",
    FIREWALL_PORTS_TABLE: "firewall_ports",
  },
};

export default config;
