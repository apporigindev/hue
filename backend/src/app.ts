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

export interface Deps {
  store: SubscriptionStore;
  verifyAppleTransaction: (jws: string) => Promise<AppleResult>;
  verifyAppleNotification: (
    payload: string
  ) => Promise<{ notificationType: string; subtype: string | null; result: AppleResult | null }>;
  verifyGoogleSubscription: (purchaseToken: string) => Promise<GoogleResult>;
  decodeGoogleNotification: (body: unknown) => { purchaseToken: string | null; productId: string | null };
  googleEnabled: boolean;
}

const verifyBody = z.object({
  appUserId: z.string().min(8).max(128),
  platform: z.enum(["apple", "google"]),
  signedTransaction: z.string().optional(),
  purchaseToken: z.string().optional(),
});

export function buildApp(deps: Deps): FastifyInstance {
  const app = Fastify({ logger: env.NODE_ENV !== "test" });

  // Optional shared-secret gate for app-facing routes.
  const requireApiKey = async (req: any, reply: any) => {
    if (!env.APP_API_KEY) return;
    if (req.headers["x-api-key"] !== env.APP_API_KEY) {
      reply.code(401).send({ error: "unauthorized" });
    }
  };

  app.get("/health", async () => ({ ok: true, service: "seasonist-subscriptions" }));

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

  app.setErrorHandler((err, _req, reply) => {
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
