/**
 * app.ts — the Fastify app factory. Dependencies (store + validators) are
 * injected so tests can supply an in-memory store and stubbed validators.
 *
 * Routes:
 *   GET  /health
 *   POST /v1/entitlement/verify        app sends a purchase → validated → entitlement
 *   GET  /v1/entitlement/:appUserId    current entitlement for an anonymous user
 *   POST /v1/apple/notifications       App Store Server Notifications V2 webhook
 *   POST /v1/google/notifications      Google Play RTDN (Pub/Sub) webhook
 */
import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";
import { env } from "./config/env.js";
import { toEntitlement } from "./lib/entitlement.js";
import { AppleNotConfiguredError, type AppleResult } from "./lib/apple.js";
import { GoogleNotConfiguredError, type GoogleResult } from "./lib/google.js";
import type { SubscriptionStore } from "./lib/store.js";
import { runTryOn, TryOnError } from "./lib/tryon/service.js";
import type { TryOnProvider } from "./lib/tryon/provider.js";
import type { ConsumedStore } from "./lib/tryon/consumed.js";

export interface Deps {
  store: SubscriptionStore;
  verifyAppleTransaction: (jws: string) => Promise<AppleResult>;
  verifyAppleNotification: (
    payload: string
  ) => Promise<{ notificationType: string; subtype: string | null; result: AppleResult | null }>;
  verifyGoogleSubscription: (purchaseToken: string) => Promise<GoogleResult>;
  decodeGoogleNotification: (body: unknown) => { purchaseToken: string | null; productId: string | null };
  googleEnabled: boolean;
  // Optional: the generative "See it for real" try-on tier. When present, the
  // /v1/tryon route is registered and /health reports whether a provider is
  // configured (the app feature-flags on that).
  tryon?: {
    provider: TryOnProvider | null;
    // Whether a usable purchase-verification path exists. /health advertises the
    // feature only when a provider AND this are present, so the app never shows a
    // paid tier whose purchases can't be verified.
    verifyReady: boolean;
    consumed: ConsumedStore;
    verifyTransactionId?: (transactionId: string) => Promise<AppleResult>;
    productId: string;
    maxColors: number;
    maxAttempts: number;
    maxImageBytes: number;
    ratePerMin: number;
    devBypass: boolean;
    log?: (msg: string, err?: unknown) => void;
  };
}

/** Approximate decoded byte size of a base64 data URI (4 b64 chars → 3 bytes). */
function estimateDecodedBytes(dataUri: string): number {
  const comma = dataUri.indexOf(",");
  const b64 = comma >= 0 ? dataUri.slice(comma + 1) : dataUri;
  return Math.floor((b64.length * 3) / 4);
}

const verifyBody = z.object({
  appUserId: z.string().min(8).max(128),
  platform: z.enum(["apple", "google"]),
  signedTransaction: z.string().optional(),
  purchaseToken: z.string().optional(),
});

export function buildApp(deps: Deps): FastifyInstance {
  const app = Fastify({ logger: env.NODE_ENV !== "test" });

  // CORS. The Capacitor WebView is cross-origin to the backend — it calls from
  // capacitor://localhost (iOS) / http(s)://localhost (Android) — so the app's
  // own webview origins are ALWAYS allowed (this is what makes try-on work on a
  // real device). Extra origins (a web client, local browser QA) come from
  // CORS_ORIGINS; "*" allows any (dev only).
  const APP_WEBVIEW_ORIGINS = [
    "capacitor://localhost",
    "ionic://localhost",
    "http://localhost",
    "https://localhost",
  ];
  const corsOrigins = [
    ...APP_WEBVIEW_ORIGINS,
    ...(env.CORS_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  ];
  const allowAll = corsOrigins.includes("*");
  app.addHook("onRequest", async (req, reply) => {
    const origin = req.headers.origin;
    if (origin && (allowAll || corsOrigins.includes(origin))) {
      reply.header("access-control-allow-origin", origin);
      reply.header("vary", "Origin");
      reply.header("access-control-allow-headers", "content-type,x-api-key");
      reply.header("access-control-allow-methods", "GET,POST,OPTIONS");
    }
    if (req.method === "OPTIONS") reply.code(204).send();
  });

  // Optional shared-secret gate for app-facing routes.
  const requireApiKey = async (req: any, reply: any) => {
    if (!env.APP_API_KEY) return;
    if (req.headers["x-api-key"] !== env.APP_API_KEY) {
      reply.code(401).send({ error: "unauthorized" });
    }
  };

  app.get("/health", async () => ({
    ok: true,
    service: "seasonist-subscriptions",
    // Advertise try-on only when it can actually be delivered AND verified.
    tryonAvailable: !!deps.tryon?.provider && !!deps.tryon?.verifyReady,
  }));

  app.post("/v1/entitlement/verify", { preHandler: requireApiKey }, async (req, reply) => {
    const body = verifyBody.parse(req.body);

    if (body.platform === "apple") {
      if (!body.signedTransaction) return reply.code(400).send({ error: "signedTransaction required" });
      const r = await deps.verifyAppleTransaction(body.signedTransaction);
      await deps.store.upsert({
        appUserId: body.appUserId,
        platform: "apple",
        productId: r.productId,
        originalTransactionId: r.originalTransactionId,
        status: r.status,
        expiresAt: r.expiresAt,
        environment: r.environment,
      });
    } else {
      if (!body.purchaseToken) return reply.code(400).send({ error: "purchaseToken required" });
      const r = await deps.verifyGoogleSubscription(body.purchaseToken);
      await deps.store.upsert({
        appUserId: body.appUserId,
        platform: "google",
        productId: r.productId,
        originalTransactionId: r.originalTransactionId,
        status: r.status,
        expiresAt: r.expiresAt,
        environment: "Production",
      });
    }

    const rec = await deps.store.getByUser(body.appUserId);
    return toEntitlement(rec);
  });

  app.get("/v1/entitlement/:appUserId", { preHandler: requireApiKey }, async (req) => {
    const { appUserId } = req.params as { appUserId: string };
    const rec = await deps.store.getByUser(appUserId);
    return toEntitlement(rec);
  });

  // Apple posts { signedPayload }. Signature is verified inside the JWS, so no
  // API key. Always ack with 200 so Apple does not retry-storm.
  app.post("/v1/apple/notifications", async (req, reply) => {
    try {
      const { signedPayload } = (req.body ?? {}) as { signedPayload?: string };
      if (!signedPayload) return reply.code(400).send({ error: "signedPayload required" });
      const { result } = await deps.verifyAppleNotification(signedPayload);
      if (result) {
        let appUserId = result.appAccountToken;
        if (!appUserId && result.originalTransactionId) {
          const existing = await deps.store.getByOriginalTransactionId(result.originalTransactionId);
          appUserId = existing?.appUserId ?? null;
        }
        if (appUserId) {
          await deps.store.upsert({
            appUserId,
            platform: "apple",
            productId: result.productId,
            originalTransactionId: result.originalTransactionId,
            status: result.status,
            expiresAt: result.expiresAt,
            environment: result.environment,
          });
        } else {
          req.log.warn("apple notification: could not resolve appUserId");
        }
      }
    } catch (err) {
      req.log.error({ err }, "apple notification handling failed");
    }
    return reply.code(200).send({ ok: true });
  });

  // Google Pub/Sub RTDN push.
  app.post("/v1/google/notifications", async (req, reply) => {
    try {
      if (deps.googleEnabled) {
        const { purchaseToken } = deps.decodeGoogleNotification(req.body);
        if (purchaseToken) {
          const existing = await deps.store.getByOriginalTransactionId(purchaseToken);
          if (existing) {
            const r = await deps.verifyGoogleSubscription(purchaseToken);
            await deps.store.upsert({
              appUserId: existing.appUserId,
              platform: "google",
              productId: r.productId,
              originalTransactionId: r.originalTransactionId,
              status: r.status,
              expiresAt: r.expiresAt,
              environment: "Production",
            });
          }
        }
      }
    } catch (err) {
      req.log.error({ err }, "google notification handling failed");
    }
    return reply.code(200).send({ ok: true });
  });

  // ── "See it for real" generative try-on ───────────────────────────
  if (deps.tryon) {
    const tryon = deps.tryon;

    // Basic per-IP flood protection (single-instance in-memory sliding window).
    const hits = new Map<string, number[]>();
    const rateLimit = async (req: any, reply: any) => {
      const now = Date.now();
      const ip = req.ip || "unknown";
      const win = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
      if (win.length >= tryon.ratePerMin) {
        return reply.code(429).send({ error: "rate_limited" });
      }
      win.push(now);
      hits.set(ip, win);
      if (hits.size > 5000) hits.clear(); // crude cap to bound memory
    };

    const tryonBody = z.object({
      appUserId: z.string().min(1).max(128),
      platform: z.enum(["apple", "google"]).default("apple"),
      transactionId: z.string().max(64).optional(),
      signedTransaction: z.string().optional(),
      photo: z.string().min(1), // data URI — held in memory only, never stored
      season: z.string().max(64).optional().default(""),
      colors: z
        .array(z.object({ name: z.string().min(1).max(48), hex: z.string().regex(/^#[0-9a-fA-F]{6}$/) }))
        .min(1)
        .max(12),
    });

    app.post(
      "/v1/tryon",
      { preHandler: [rateLimit, requireApiKey], bodyLimit: Math.ceil(tryon.maxImageBytes * 1.4) + 1_048_576 },
      async (req, reply) => {
        const body = tryonBody.parse(req.body);
        if (estimateDecodedBytes(body.photo) > tryon.maxImageBytes) {
          return reply.code(413).send({ error: "image_too_large" });
        }
        const images = await runTryOn(
          {
            provider: tryon.provider,
            consumed: tryon.consumed,
            verifyTransactionId: tryon.verifyTransactionId,
            verifyAppleTransaction: deps.verifyAppleTransaction,
            productId: tryon.productId,
            maxColors: tryon.maxColors,
            maxAttempts: tryon.maxAttempts,
            devBypass: tryon.devBypass,
            log: tryon.log,
          },
          {
            appUserId: body.appUserId,
            transactionId: body.transactionId,
            signedTransaction: body.signedTransaction,
            photo: body.photo,
            season: body.season,
            colors: body.colors,
          }
        );
        return { images, meta: { count: images.length } };
      }
    );
  }

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof TryOnError) {
      return reply.code(err.statusCode).send({ error: err.code, detail: err.message });
    }
    if (err instanceof AppleNotConfiguredError || err instanceof GoogleNotConfiguredError) {
      return reply.code(503).send({ error: "purchase_verification_unavailable", detail: err.message });
    }
    if (err instanceof z.ZodError) {
      return reply.code(400).send({ error: "invalid_request", detail: err.flatten() });
    }
    // Verification failures from the Apple/Google libraries → treat as a bad receipt.
    if (/verif|decode|signature|invalid/i.test(err.message)) {
      return reply.code(400).send({ error: "invalid_receipt", detail: err.message });
    }
    reply.log.error({ err }, "unhandled error");
    return reply.code(500).send({ error: "internal_error" });
  });

  return app;
}
