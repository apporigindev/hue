/**
 * service.ts — orchestrates one try-on request:
 *   verify the purchase → assert product + owner → count a bounded attempt
 *   (replay + cost cap) → generate (partial-tolerant) → commit on success.
 *
 * Cost-safety model: the image provider bills per call, so we never allow
 * unbounded "retry on failure". Each transaction gets at most `maxAttempts`
 * tries (beginAttempt), a successful render (>=1 image) commits it, and a
 * failure simply leaves the attempt counted — so one purchase can never burn
 * more than maxAttempts × pack of provider spend.
 *
 * Pure w.r.t. I/O: all collaborators are injected, so it is trivially testable.
 */
import { AppleNotConfiguredError, type AppleResult } from "../apple.js";
import type { ConsumedStore } from "./consumed.js";
import type { GeneratedImage, TargetColor, TryOnProvider } from "./provider.js";

export class TryOnError extends Error {
  constructor(message: string, public readonly statusCode: number, public readonly code: string) {
    super(message);
    this.name = "TryOnError";
  }
}
export const errUnavailable = () => new TryOnError("try-on is not available", 503, "tryon_unavailable");
export const errBadRequest = (m: string) => new TryOnError(m, 400, "bad_request");
export const errEntitlement = (m: string) => new TryOnError(m, 403, "not_entitled");
export const errAlreadyUsed = () => new TryOnError("this purchase has already been used", 409, "already_used");
export const errExhausted = () => new TryOnError("too many attempts for this purchase", 409, "attempts_exhausted");
export const errGenerationFailed = () => new TryOnError("could not generate images", 502, "generation_failed");

export interface TryOnInput {
  appUserId: string;
  transactionId?: string; // preferred proof (verified via App Store Server API)
  signedTransaction?: string; // fallback proof (StoreKit 2 JWS)
  photo: string; // data URI
  season: string;
  colors: TargetColor[];
}

export interface TryOnServiceDeps {
  provider: TryOnProvider | null;
  consumed: ConsumedStore;
  verifyTransactionId?: (transactionId: string) => Promise<AppleResult>;
  verifyAppleTransaction: (jws: string) => Promise<AppleResult>;
  productId: string;
  maxColors: number;
  maxAttempts: number;
  devBypass: boolean; // dev/test only — skip entitlement + attempt accounting
  log?: (msg: string, err?: unknown) => void;
}

/** Transient/config failures we must NOT report as "not entitled". */
function isInfraError(e: unknown): boolean {
  if (e instanceof AppleNotConfiguredError) return true;
  const m = (e as Error)?.message ?? "";
  return /network|fetch failed|timeout|ETIMEDOUT|ENOTFOUND|ECONN|getaddrinfo|socket|50\d\b/i.test(m);
}

export async function runTryOn(deps: TryOnServiceDeps, input: TryOnInput): Promise<GeneratedImage[]> {
  if (!deps.provider) throw errUnavailable();

  const colors = (input.colors ?? []).slice(0, deps.maxColors);
  if (colors.length === 0) throw errBadRequest("at least one color is required");

  // ── Entitlement + bounded-attempt accounting (skipped only in dev bypass) ──
  let attempt = 1;
  if (!deps.devBypass) {
    let r: AppleResult;
    try {
      if (input.transactionId && deps.verifyTransactionId) {
        r = await deps.verifyTransactionId(input.transactionId);
      } else if (input.signedTransaction) {
        r = await deps.verifyAppleTransaction(input.signedTransaction);
      } else {
        throw errBadRequest("transactionId or signedTransaction required");
      }
    } catch (e) {
      if (e instanceof TryOnError) throw e;
      // Distinguish "we couldn't reach/verify" (retryable) from "bad receipt".
      if (isInfraError(e)) throw errUnavailable();
      throw errEntitlement(`purchase could not be verified: ${(e as Error).message}`);
    }
    if (r.productId !== deps.productId) throw errEntitlement("purchase is not the try-on product");
    if (!r.transactionId) throw errEntitlement("purchase has no transaction id");
    // Bind the purchase to its owner when the app set an appAccountToken.
    if (r.appAccountToken && input.appUserId && r.appAccountToken !== input.appUserId) {
      throw errEntitlement("purchase belongs to a different user");
    }

    const key = `apple:${r.transactionId}`;
    const res = await deps.consumed.beginAttempt(key, deps.maxAttempts);
    if (res.status === "used") throw errAlreadyUsed();
    if (res.status === "exhausted") throw errExhausted();
    attempt = res.attempt;

    return await generateAndCommit(deps, { photo: input.photo, season: input.season, colors, attempt }, key);
  }

  // dev bypass: generate without accounting
  const images = await safeGenerate(deps, { photo: input.photo, season: input.season, colors, attempt });
  if (images.length === 0) throw errGenerationFailed();
  return images;
}

async function generateAndCommit(
  deps: TryOnServiceDeps,
  job: { photo: string; season: string; colors: TargetColor[]; attempt: number },
  key: string
): Promise<GeneratedImage[]> {
  const images = await safeGenerate(deps, job);
  // A failed render does not consume the purchase — the attempt is already
  // counted, so retries are naturally bounded by maxAttempts.
  if (images.length === 0) throw errGenerationFailed();
  // Commit AFTER we have deliverable images. A commit failure must not discard
  // already-generated (already-billed) images — return them and log for repair.
  try {
    await deps.consumed.commit(key);
  } catch (e) {
    deps.log?.("tryon: commit failed after successful generation", e);
  }
  return images;
}

async function safeGenerate(
  deps: TryOnServiceDeps,
  job: { photo: string; season: string; colors: TargetColor[]; attempt: number }
): Promise<GeneratedImage[]> {
  try {
    return await deps.provider!.generate(job);
  } catch (e) {
    deps.log?.("tryon: provider.generate threw", e);
    return [];
  }
}
