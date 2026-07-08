/**
 * purchase.js — one-time "unlock this analysis" consumable purchase.
 *
 * On a device this drives the native In-App Purchase sheet (StoreKit 2 on iOS,
 * Play Billing on Android) via the cordova-plugin-purchase plugin. Digital
 * unlocks MUST go through Apple/Google — external processors (Stripe, Revolut,
 * direct card) are not allowed for in-app digital goods. The user's own cards
 * and Apple Pay / Google Pay are what the system sheet pays with.
 *
 * In the browser (dev / preview) a clearly-labelled simulated sheet stands in
 * so the flow is testable without a device.
 */

export const UNLOCK_PRODUCT_ID = "seasonist.analysis.unlock";
export const TRYON_PRODUCT_ID = "seasonist.tryon.unlock";
const PRICE_FALLBACK = "€4.99";
const TRYON_PRICE_FALLBACK = "€8.99";

function nativeStore() {
  return typeof window !== "undefined" && window.CdvPurchase ? window.CdvPurchase : null;
}

let initialized = false;
// Resolver for an in-flight try-on purchase, so we can hand the transaction's
// proof back to the caller (the generic approved handler runs for all products).
let pendingTryon = null;

export async function initPurchases() {
  const Cdv = nativeStore();
  if (!Cdv || initialized) return;
  const { store, ProductType, Platform } = Cdv;
  store.register([
    { id: UNLOCK_PRODUCT_ID, type: ProductType.CONSUMABLE, platform: Platform.APPLE_APPSTORE },
    { id: TRYON_PRODUCT_ID, type: ProductType.CONSUMABLE, platform: Platform.APPLE_APPSTORE },
  ]);
  // Verify then finish every approved transaction (on-device verification).
  store.when().approved((t) => {
    // For a try-on purchase, capture the proof before finishing so the backend
    // can verify it (the transactionId is looked up via the App Store Server API).
    try {
      if (pendingTryon && transactionHasProduct(t, TRYON_PRODUCT_ID)) {
        pendingTryon.resolve({ ok: true, ...extractProof(t) });
        pendingTryon = null;
      }
    } catch {
      /* ignore — verify/finish still proceeds below */
    }
    t.verify();
  });
  store.when().verified((r) => r.finish());
  await store.initialize([Platform.APPLE_APPSTORE]);
  initialized = true;
}

function transactionHasProduct(t, productId) {
  if (!t) return false;
  if (t.productId === productId) return true;
  const products = Array.isArray(t.products) ? t.products : [];
  return products.some((p) => (p && (p.id || p.productId)) === productId);
}

// Field names differ across cordova-plugin-purchase / StoreKit versions.
// transactionId is the reliably-available proof; jwsRepresentation is sent too
// when the SK2 plugin exposes it. (Verify the exact fields on a sandbox device.)
function extractProof(t) {
  const np = t.nativePurchase || {};
  return {
    transactionId: t.transactionId || np.transactionId || np.transaction_id || np.id || null,
    signedTransaction: np.jwsRepresentation || t.jwsRepresentation || null,
  };
}

/** Localized store price (e.g. "€4.99", "$4.99", "9,99 лв") or a fallback. */
export async function getUnlockPrice() {
  return priceFor(UNLOCK_PRODUCT_ID, PRICE_FALLBACK);
}

/** Localized store price for the try-on pack, or a fallback. */
export async function getTryonPrice() {
  return priceFor(TRYON_PRODUCT_ID, TRYON_PRICE_FALLBACK);
}

async function priceFor(productId, fallback) {
  const Cdv = nativeStore();
  if (Cdv) {
    try {
      const product = Cdv.store.get(productId);
      const offer = product && product.getOffer && product.getOffer();
      const price = offer?.pricingPhases?.[0]?.price;
      if (price) return price;
    } catch {
      /* fall through to fallback */
    }
  }
  return fallback;
}

/**
 * Runs the purchase. Resolves { ok: true } on success,
 * { ok: false, cancelled: true } if the user backs out, and throws on error.
 */
export async function buyUnlock() {
  const Cdv = nativeStore();
  if (Cdv) return nativeBuy(Cdv);
  return simulatedSheet("Full analysis", PRICE_FALLBACK);
}

async function nativeBuy(Cdv) {
  const product = Cdv.store.get(UNLOCK_PRODUCT_ID);
  if (!product) throw new Error("Product not available");
  const offer = product.getOffer();
  // The plugin presents the OS payment sheet; approved→verify→finish is wired
  // in initPurchases(). order() resolves once the transaction is placed.
  await offer.order();
  return { ok: true };
}

/**
 * Runs the try-on pack purchase. Resolves { ok:true, transactionId?,
 * signedTransaction? } on success (the proof the backend verifies),
 * { ok:false, cancelled:true } if the user backs out, and throws on error.
 */
export async function buyTryon() {
  const Cdv = nativeStore();
  if (Cdv) return nativeBuyTryon(Cdv);
  return simulatedSheet("See it for real", TRYON_PRICE_FALLBACK, true);
}

function nativeBuyTryon(Cdv) {
  const product = Cdv.store.get(TRYON_PRODUCT_ID);
  if (!product) throw new Error("Product not available");
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (pendingTryon) {
        pendingTryon = null;
        reject(new Error("purchase timed out"));
      }
    }, 120000);
    pendingTryon = {
      resolve: (v) => {
        clearTimeout(timeout);
        resolve(v);
      },
      reject: (e) => {
        clearTimeout(timeout);
        reject(e);
      },
    };
    // approved→(capture proof)→verify→finish is wired in initPurchases().
    product
      .getOffer()
      .order()
      .catch((e) => {
        clearTimeout(timeout);
        pendingTryon = null;
        // The plugin rejects on cancel too; treat as a cancellation.
        resolve({ ok: false, cancelled: true, reason: e && e.message });
      });
  });
}

/* ---------------- simulated sheet (dev / browser preview only) ---------------- */

function simulatedSheet(itemLabel, price, withProof = false) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "pay-sheet-overlay";
    overlay.innerHTML = `
      <div class="pay-sheet" role="dialog" aria-modal="true" aria-label="App Store purchase">
        <div class="pay-note">Simulated App Store purchase — dev only. On a device this is Apple's system sheet.</div>
        <div class="pay-head">
          <div class="pay-app">
            <div class="pay-icon" aria-hidden="true"></div>
            <div><div class="pay-name">Seasonist</div><div class="pay-item">${itemLabel}</div></div>
          </div>
          <div class="pay-price">${price}</div>
        </div>
        <div class="pay-method">
          <span> Pay with your card / Apple Pay</span>
          <span class="pay-acct">Apple&nbsp;ID</span>
        </div>
        <button class="pay-confirm" type="button">Confirm — Double-click to Pay</button>
        <button class="pay-cancel" type="button">Cancel</button>
      </div>`;
    document.body.appendChild(overlay);

    const done = (result) => {
      overlay.remove();
      resolve(result);
    };
    overlay.querySelector(".pay-cancel").addEventListener("click", () => done({ ok: false, cancelled: true }));
    overlay.querySelector(".pay-sheet").addEventListener("click", (e) => e.stopPropagation());
    overlay.addEventListener("click", () => done({ ok: false, cancelled: true }));
    overlay.querySelector(".pay-confirm").addEventListener("click", (e) => {
      const btn = e.currentTarget;
      btn.textContent = "Processing…";
      btn.disabled = true;
      overlay.querySelector(".pay-cancel").style.visibility = "hidden";
      setTimeout(() => {
        const res = { ok: true, simulated: true };
        if (withProof) res.transactionId = "SIMULATED-" + Date.now();
        done(res);
      }, 1100);
    });
  });
}
