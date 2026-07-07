/**
 * env.ts — startup configuration, validated with Zod.
 * Apple config is required to verify iOS purchases; Google config is optional
 * (Android can be added later). The server boots without a DATABASE_URL by
 * falling back to an in-memory store (dev/test only — not for production).
 */
import { z } from "zod";

const boolish = (def: boolean) =>
  z.preprocess(
    (v) => (v === undefined ? def : v === "true" || v === "1" || v === true),
    z.boolean()
  );

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(8080),

  // Persistence. If absent, an in-memory store is used (a startup warning is
  // logged). Production MUST set DATABASE_URL.
  DATABASE_URL: z.string().url().optional(),

  // ── Apple (App Store) ──────────────────────────────────────────────
  APPLE_BUNDLE_ID: z.string().min(1).default("com.apporigin.seasonist"),
  // Numeric App Store app id (appAppleId). Required for production
  // transaction verification; may be omitted in Sandbox.
  APPLE_APP_APPLE_ID: z.coerce.number().optional(),
  APPLE_ENVIRONMENT: z.enum(["Sandbox", "Production"]).default("Sandbox"),
  // Directory holding the Apple root CA certificates (.cer/.pem) downloaded
  // from https://www.apple.com/certificateauthority/. Without them, purchase
  // verification is disabled and the relevant routes return 503.
  APPLE_ROOT_CERTS_DIR: z.string().default("./certs"),
  APPLE_ENABLE_ONLINE_CHECKS: boolish(false),

  // Optional App Store Server API credentials (only needed if the backend
  // calls Apple's API — e.g. on-demand status lookups. Not required for the
  // verify + notifications flow, which is signature-verified locally).
  APPLE_ISSUER_ID: z.string().optional(),
  APPLE_KEY_ID: z.string().optional(),
  APPLE_PRIVATE_KEY: z.string().optional(), // .p8 contents (PEM)

  // ── Google Play (optional — Android) ──────────────────────────────
  GOOGLE_PACKAGE_NAME: z.string().optional(),
  // Service-account JSON, base64-encoded (Play Developer API access).
  GOOGLE_SERVICE_ACCOUNT_B64: z.string().optional(),

  // Shared secret the app sends (header x-api-key) so only your app can call
  // the verify endpoint. Optional but recommended in production.
  APP_API_KEY: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const appleConfigured = () => true; // bundle id always has a default
export const googleConfigured = () =>
  !!(env.GOOGLE_PACKAGE_NAME && env.GOOGLE_SERVICE_ACCOUNT_B64);
