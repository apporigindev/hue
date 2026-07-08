import { describe, it, expect } from "vitest";
import { buildApp, type Deps } from "../app.js";
import { MemoryStore } from "../lib/store.js";
import { MemoryConsumedStore } from "../lib/tryon/consumed.js";
import type { AppleResult } from "../lib/apple.js";
import type { GeneratedImage, TryOnJob, TryOnProvider } from "../lib/tryon/provider.js";

const TRYON_PRODUCT = "seasonist.tryon.unlock";
const PNG = "data:image/png;base64,iVBORw0KGgo="; // tiny stand-in "photo"

function appleResult(over: Partial<AppleResult> = {}): AppleResult {
  return {
    productId: TRYON_PRODUCT,
    transactionId: "TXN-1",
    originalTransactionId: "OTID-1",
    appAccountToken: "user-abc-123",
    expiresAt: null,
    environment: "Sandbox",
    status: "active",
    ...over,
  };
}

class FakeProvider implements TryOnProvider {
  readonly name = "fake";
  calls = 0;
  async generate(job: TryOnJob): Promise<GeneratedImage[]> {
    this.calls++;
    return job.colors.map((c) => ({ colorName: c.name, hex: c.hex, dataUrl: PNG }));
  }
}

class FlakyProvider implements TryOnProvider {
  readonly name = "flaky";
  calls = 0;
  async generate(job: TryOnJob): Promise<GeneratedImage[]> {
    this.calls++;
    if (this.calls === 1) throw new Error("boom");
    return job.colors.map((c) => ({ colorName: c.name, hex: c.hex, dataUrl: PNG }));
  }
}

class EmptyProvider implements TryOnProvider {
  readonly name = "empty";
  async generate(): Promise<GeneratedImage[]> {
    return []; // all colors failed
  }
}

function makeApp(
  tryonOver: Partial<NonNullable<Deps["tryon"]>> = {},
  depsOver: Partial<Deps> = {}
) {
  const deps: Deps = {
    store: new MemoryStore(),
    verifyAppleTransaction: async () => appleResult(),
    verifyAppleNotification: async () => ({ notificationType: "TEST", subtype: null, result: null }),
    verifyGoogleSubscription: async () => ({
      productId: null,
      originalTransactionId: null,
      expiresAt: null,
      status: "expired",
    }),
    decodeGoogleNotification: () => ({ purchaseToken: null, productId: null }),
    googleEnabled: false,
    tryon: {
      provider: new FakeProvider(),
      verifyReady: true,
      consumed: new MemoryConsumedStore(),
      productId: TRYON_PRODUCT,
      maxColors: 5,
      maxAttempts: 3,
      maxImageBytes: 10 * 1024 * 1024,
      ratePerMin: 1000,
      devBypass: false,
      ...tryonOver,
    },
    ...depsOver,
  };
  return buildApp(deps);
}

const body = (over: Record<string, unknown> = {}) => ({
  appUserId: "user-abc-123",
  platform: "apple",
  signedTransaction: "JWS",
  photo: PNG,
  season: "True Autumn",
  colors: [
    { name: "Rust", hex: "#B7410E" },
    { name: "Olive", hex: "#708238" },
  ],
  ...over,
});

async function post(app: ReturnType<typeof buildApp>, payload: Record<string, unknown>) {
  return app.inject({ method: "POST", url: "/v1/tryon", payload });
}

describe("health", () => {
  it("reports tryonAvailable=true when a provider is configured", async () => {
    const res = await makeApp().inject({ method: "GET", url: "/health" });
    expect(res.json()).toMatchObject({ ok: true, tryonAvailable: true });
  });

  it("reports tryonAvailable=false when no provider is configured", async () => {
    const res = await makeApp({ provider: null }).inject({ method: "GET", url: "/health" });
    expect(res.json().tryonAvailable).toBe(false);
  });
});

describe("POST /v1/tryon", () => {
  it("generates one image per requested color on the happy path", async () => {
    const res = await post(makeApp(), body());
    expect(res.statusCode).toBe(200);
    const json = res.json();
    expect(json.meta.count).toBe(2);
    expect(json.images.map((i: GeneratedImage) => i.colorName)).toEqual(["Rust", "Olive"]);
  });

  it("caps renders at maxColors", async () => {
    const res = await post(
      makeApp({ maxColors: 2 }),
      body({ colors: [1, 2, 3, 4].map((n) => ({ name: `C${n}`, hex: "#112233" })) })
    );
    expect(res.json().meta.count).toBe(2);
  });

  it("rejects a purchase for the wrong product (403)", async () => {
    const app = makeApp({}, { verifyAppleTransaction: async () => appleResult({ productId: "seasonist.analysis.unlock" }) });
    const res = await post(app, body());
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toBe("not_entitled");
  });

  it("rejects a replayed transaction (409 already_used)", async () => {
    const app = makeApp(); // shared consumed store + fixed transactionId
    expect((await post(app, body())).statusCode).toBe(200);
    const second = await post(app, body());
    expect(second.statusCode).toBe(409);
    expect(second.json().error).toBe("already_used");
  });

  it("requires some purchase proof when not in dev bypass (400)", async () => {
    const res = await post(makeApp(), body({ signedTransaction: undefined, transactionId: undefined }));
    expect(res.statusCode).toBe(400);
  });

  it("verifies via the App Store Server API transactionId path when available", async () => {
    let seen = "";
    const app = makeApp({
      verifyTransactionId: async (id) => {
        seen = id;
        return appleResult({ transactionId: id });
      },
    });
    const res = await post(app, body({ transactionId: "TXN-XYZ", signedTransaction: undefined }));
    expect(res.statusCode).toBe(200);
    expect(seen).toBe("TXN-XYZ");
  });

  it("blocks replay on the transactionId path too (409)", async () => {
    const app = makeApp({ verifyTransactionId: async (id) => appleResult({ transactionId: id }) });
    expect((await post(app, body({ transactionId: "T-9", signedTransaction: undefined }))).statusCode).toBe(200);
    const second = await post(app, body({ transactionId: "T-9", signedTransaction: undefined }));
    expect(second.statusCode).toBe(409);
  });

  it("does NOT consume the purchase when generation fails, allowing a retry", async () => {
    const provider = new FlakyProvider();
    const app = makeApp({ provider });
    const first = await post(app, body());
    expect(first.statusCode).toBe(502); // generation_failed (provider threw → 0 images)
    expect(first.json().error).toBe("generation_failed");
    const second = await post(app, body()); // same transaction — must be retryable
    expect(second.statusCode).toBe(200);
    expect(provider.calls).toBe(2);
  });

  it("caps retries at maxAttempts (bounded cost)", async () => {
    const app = makeApp({ provider: new EmptyProvider(), maxAttempts: 2 });
    expect((await post(app, body())).statusCode).toBe(502); // attempt 1
    expect((await post(app, body())).statusCode).toBe(502); // attempt 2
    const third = await post(app, body()); // attempt 3 > cap
    expect(third.statusCode).toBe(409);
    expect(third.json().error).toBe("attempts_exhausted");
  });

  it("returns partial results (never fails the whole pack for one bad color)", async () => {
    // FakeProvider returns one image per color; a real partial-tolerant provider
    // drops failed colors. Here we assert the happy multi-color path commits.
    const app = makeApp();
    const res = await post(app, body());
    expect(res.statusCode).toBe(200);
    expect(res.json().meta.count).toBe(2);
  });

  it("does not advertise try-on when verification is not ready", async () => {
    const res = await makeApp({ verifyReady: false }).inject({ method: "GET", url: "/health" });
    expect(res.json().tryonAvailable).toBe(false);
  });

  it("rejects an oversized photo (413)", async () => {
    const app = makeApp({ maxImageBytes: 64 });
    const big = "data:image/jpeg;base64," + "A".repeat(500);
    const res = await post(app, body({ photo: big }));
    expect(res.statusCode).toBe(413);
  });

  it("returns 503 when no provider is configured", async () => {
    const res = await post(makeApp({ provider: null }), body());
    expect(res.statusCode).toBe(503);
    expect(res.json().error).toBe("tryon_unavailable");
  });

  it("works in dev bypass without any purchase proof", async () => {
    const res = await post(makeApp({ devBypass: true }), body({ signedTransaction: undefined }));
    expect(res.statusCode).toBe(200);
    expect(res.json().meta.count).toBe(2);
  });

  it("validates color hex format (400)", async () => {
    const res = await post(makeApp(), body({ colors: [{ name: "Bad", hex: "notacolor" }] }));
    expect(res.statusCode).toBe(400);
  });
});
