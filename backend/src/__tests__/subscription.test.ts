import { describe, it, expect, beforeEach } from "vitest";
import { buildApp, type Deps } from "../app.js";
import { MemoryStore } from "../lib/store.js";
import { toEntitlement } from "../lib/entitlement.js";
import type { AppleResult } from "../lib/apple.js";

const day = 86_400_000;

function appleResult(over: Partial<AppleResult> = {}): AppleResult {
  return {
    productId: "seasonist.premium.annual",
    transactionId: "TXN-1",
    originalTransactionId: "OTID-1",
    appAccountToken: "user-abc-123",
    expiresAt: new Date(Date.now() + day),
    environment: "Sandbox",
    status: "active",
    ...over,
  };
}

function makeApp(over: Partial<Deps> = {}) {
  const store = new MemoryStore();
  const deps: Deps = {
    store,
    verifyAppleTransaction: async () => appleResult(),
    verifyAppleNotification: async () => ({
      notificationType: "DID_RENEW",
      subtype: null,
      result: appleResult(),
    }),
    verifyGoogleSubscription: async () => ({
      productId: "seasonist.premium.annual",
      originalTransactionId: "gtok-1",
      expiresAt: new Date(Date.now() + day),
      status: "active",
    }),
    decodeGoogleNotification: () => ({ purchaseToken: null, productId: null }),
    googleEnabled: false,
    ...over,
  };
  return { app: buildApp(deps), store };
}

describe("toEntitlement", () => {
  it("grants access for an active, unexpired record", () => {
    const e = toEntitlement({
      appUserId: "u",
      platform: "apple",
      productId: "p",
      originalTransactionId: "o",
      status: "active",
      expiresAt: new Date(Date.now() + day),
      environment: "Sandbox",
      updatedAt: new Date(),
    });
    expect(e.active).toBe(true);
  });

  it("denies access once expired", () => {
    const e = toEntitlement({
      appUserId: "u",
      platform: "apple",
      productId: "p",
      originalTransactionId: "o",
      status: "active",
      expiresAt: new Date(Date.now() - day),
      environment: "Sandbox",
      updatedAt: new Date(),
    });
    expect(e.active).toBe(false);
    expect(e.status).toBe("expired");
  });

  it("denies access for a refund", () => {
    const e = toEntitlement({
      appUserId: "u",
      platform: "apple",
      productId: "p",
      originalTransactionId: "o",
      status: "refunded",
      expiresAt: new Date(Date.now() + day),
      environment: "Sandbox",
      updatedAt: new Date(),
    });
    expect(e.active).toBe(false);
  });

  it("returns no entitlement for null", () => {
    expect(toEntitlement(null).active).toBe(false);
    expect(toEntitlement(null).status).toBe("none");
  });
});

describe("routes", () => {
  it("GET /health", async () => {
    const { app } = makeApp();
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json().ok).toBe(true);
  });

  it("verifies an Apple purchase and returns an active entitlement", async () => {
    const { app } = makeApp();
    const res = await app.inject({
      method: "POST",
      url: "/v1/entitlement/verify",
      payload: { appUserId: "user-abc-123", platform: "apple", signedTransaction: "signed.jws" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.active).toBe(true);
    expect(body.productId).toBe("seasonist.premium.annual");

    // and it's queryable afterwards
    const get = await app.inject({ method: "GET", url: "/v1/entitlement/user-abc-123" });
    expect(get.json().active).toBe(true);
  });

  it("rejects an Apple verify with no signedTransaction", async () => {
    const { app } = makeApp();
    const res = await app.inject({
      method: "POST",
      url: "/v1/entitlement/verify",
      payload: { appUserId: "user-abc-123", platform: "apple" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("an EXPIRED notification revokes access", async () => {
    const { app } = makeApp({
      verifyAppleNotification: async () => ({
        notificationType: "EXPIRED",
        subtype: "VOLUNTARY",
        result: appleResult({ status: "expired", expiresAt: new Date(Date.now() - day) }),
      }),
    });
    // seed an active subscription
    await app.inject({
      method: "POST",
      url: "/v1/entitlement/verify",
      payload: { appUserId: "user-abc-123", platform: "apple", signedTransaction: "signed.jws" },
    });
    // apple tells us it expired
    const note = await app.inject({
      method: "POST",
      url: "/v1/apple/notifications",
      payload: { signedPayload: "signed.notification" },
    });
    expect(note.statusCode).toBe(200);

    const get = await app.inject({ method: "GET", url: "/v1/entitlement/user-abc-123" });
    expect(get.json().active).toBe(false);
    expect(get.json().status).toBe("expired");
  });

  it("unknown user has no entitlement", async () => {
    const { app } = makeApp();
    const res = await app.inject({ method: "GET", url: "/v1/entitlement/nobody" });
    expect(res.json().active).toBe(false);
    expect(res.json().status).toBe("none");
  });
});
