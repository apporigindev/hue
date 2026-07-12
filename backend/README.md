# Seasonist — Subscription Backend

A small Fastify (TypeScript, ESM) service that validates in-app purchases and
tracks premium entitlements for the Seasonist app. It powers the paywall's
"is this user premium?" check across devices and handles Apple/Google server
notifications (renewals, expirations, refunds).

**Privacy:** entitlements are keyed by an **anonymous** app-user id the app
generates on-device. No personal data — no name, email, or photo — is ever
sent here or stored. The photo is still analysed entirely on-device.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness check |
| `POST` | `/v1/entitlement/verify` | App sends a purchase → validated → entitlement returned |
| `GET` | `/v1/entitlement/:appUserId` | Current entitlement for an anonymous user |
| `POST` | `/v1/apple/notifications` | App Store Server Notifications V2 webhook |
| `POST` | `/v1/google/notifications` | Google Play RTDN (Pub/Sub) webhook |

`verify` body: `{ appUserId, platform: "apple" | "google", signedTransaction?, purchaseToken? }`
→ returns `{ active, productId, status, expiresAt, environment }`.

## Local development

```bash
npm install
cp .env.example .env          # fill in as needed
npm test                      # 9 tests, mocked — no credentials needed
npm run dev                   # tsx watch on :8080
```

Without `DATABASE_URL` it uses an in-memory store (dev only). Without the Apple
root certs it boots fine but purchase routes return 503 until you add them.

## Going live — checklist

The code is complete; these steps need your Apple/Google accounts and a host.

### 1. Database
- Provision Postgres, set `DATABASE_URL`.
- Run the migration: `psql "$DATABASE_URL" -f migrations/001_subscriptions.sql`.

### 2. Apple (App Store)
1. Create the app + **auto-renewable subscription** and/or **non-consumable**
   products in App Store Connect (e.g. `seasonist.premium.annual`,
   `seasonist.premium.monthly`, `seasonist.premium.lifetime`).
2. Download the **Apple Root CA certificates** from
   <https://www.apple.com/certificateauthority/> (at least `AppleRootCA-G3.cer`)
   into `certs/`.
3. Set `APPLE_BUNDLE_ID`, `APPLE_APP_APPLE_ID` (numeric app id),
   `APPLE_ENVIRONMENT` (`Sandbox` for testing, `Production` for release).
4. In App Store Connect → your app → **App Store Server Notifications**, set the
   Production and Sandbox URLs to `https://<your-host>/v1/apple/notifications`
   (Version 2).
5. (Optional) For on-demand status lookups via Apple's API, generate an
   In-App Purchase key and set `APPLE_ISSUER_ID` / `APPLE_KEY_ID` /
   `APPLE_PRIVATE_KEY`. Not required for the verify + notifications flow.

### 3. Google Play (optional — Android)
- Set `GOOGLE_PACKAGE_NAME` and `GOOGLE_SERVICE_ACCOUNT_B64` (base64 of a
  Play Developer API service-account JSON).
- Configure Real-time Developer Notifications (Pub/Sub) to push to
  `https://<your-host>/v1/google/notifications`.

### 4. Deploy
- Host anywhere that runs Node 22 (Railway mirrors the BidPazar setup):
  `npm run build && npm start`. Point `api.seasonist.<your-domain>` at it.
- Secure the app-facing routes by setting `APP_API_KEY` and sending it as the
  `x-api-key` header from the app.

## How the app integrates (StoreKit 2)

1. On first launch, generate a random UUID `appUserId`, store it in the
   Keychain, and pass it as the purchase's `appAccountToken` so Apple's
   notifications carry it back.
2. After a purchase (or on launch), send the StoreKit 2 signed transaction to
   `POST /v1/entitlement/verify`. Gate premium features on `active === true`.
3. On launch, also `GET /v1/entitlement/:appUserId` to refresh state after
   renewals/expirations the server learned about via notifications.

> Note: once the app actually talks to this backend, the Privacy Policy and
> consent copy need a short clause about the anonymous subscription record.
> The "photo never leaves your device" promise is unaffected.

---

# "See it for real" — generative try-on tier

An **optional, paid** tier that renders the user wearing their best palette
colors. Unlike everything else in Seasonist, this one sends the selfie off the
device — so it is gated behind an explicit, unbundled, opt-in consent and is
**off by default**. The app only shows it when `GET /health` reports
`tryonAvailable: true`, which happens only when a provider is configured.

### Endpoint

`POST /v1/tryon` (guarded by `x-api-key` if `APP_API_KEY` is set)

```jsonc
{
  "appUserId": "<anon uuid>",
  "transactionId": "<StoreKit transactionId>",   // preferred proof
  "signedTransaction": "<StoreKit 2 JWS>",         // fallback proof
  "photo": "data:image/jpeg;base64,...",           // held in memory only
  "season": "True Autumn",
  "colors": [{ "name": "Rust", "hex": "#B7410E" }, ...]
}
```
→ `{ images: [{ colorName, hex, dataUrl }], meta: { count } }`.

The photo is never written to disk or logged. The provider's result URL is
fetched and inlined as a data URI, so the third-party URL is never handed to the
client or persisted.

### How it works

- **Provider:** fal.ai, model **`fal-ai/flux-pro/kontext`** (FLUX.1 Kontext
  *pro*, the image-**edit** path — never text-to-image, which would synthesize a
  different person). ~$0.04/render list; a 5-render pack is ~$0.20 raw COGS, so
  €8.99 has a very healthy margin. Swappable via `TRYON_MODEL` and the
  `TryOnProvider` interface (`src/lib/tryon/`).
- **Prompt** is deliberately *garment-only* ("change only the color of the top …
  keep the face, skin, hair, pose, lighting and background exactly the same")
  with a **pinned per-color seed**, so the same photo+color is reproducible and
  identity drift is minimized.
- **Entitlement (consumable):** the app sends the `transactionId`; the backend
  fetches Apple's own signed record via the **App Store Server API**
  (`getTransactionInfo`) and verifies it — it does **not** trust a client-signed
  blob. Replay/double-spend is blocked by a **unique** `tx_key` insert
  (`migrations/002_tryon_consumed.sql`); a render that fails **releases** the
  reservation so the buyer can retry without losing what they paid for.

### Activation (all code is done — these are account/host steps)

1. `TRYON_PROVIDER=fal` + `FAL_API_KEY=<your fal.ai key>`.
2. Populate Apple root certs: `sh scripts/fetch-apple-certs.sh`.
3. Set `APPLE_ISSUER_ID` / `APPLE_KEY_ID` / `APPLE_PRIVATE_KEY` (the same App
   Store Connect API key used elsewhere) so the transactionId proof path works.
4. `psql "$DATABASE_URL" -f migrations/002_tryon_consumed.sql`.
5. Create the consumable IAP `seasonist.tryon.unlock` in App Store Connect.
6. **Before launch:** sign the fal.ai (and Black Forest Labs) DPA and confirm
   their retention / no-training terms, then fill the exact figures into the
   Privacy Policy's "AI photo editing" section (kept deliberately non-specific
   until confirmed) and add the App Privacy label (User Content → Photos, App
   Functionality). `TRYON_DEV_BYPASS=true` + `TRYON_PROVIDER=mock` lets you
   exercise the whole flow locally with placeholder images and no key.

### Hardening applied (from the adversarial review)

- **Bounded cost per purchase:** one purchase can drive at most
  `TRYON_MAX_ATTEMPTS` × pack of provider spend. `beginAttempt` counts every try;
  a failed render leaves the attempt counted (no unbounded "release + retry").
- **Partial-tolerant generation:** one failed color no longer discards the whole
  pack — successful colors are returned and the purchase commits.
- **No prompt injection:** the model prompt is built from the regex-validated
  hex + a server-computed color word; the client's free-form color name never
  enters the prompt.
- **Feature only advertised when verifiable:** `/health.tryonAvailable` requires
  a provider AND a usable verification path (App Store Server API creds), so
  users are never shown a paid tier whose purchases can't be verified.
- **On-device CORS:** the backend always allows the Capacitor WebView origins
  (`capacitor://localhost`, `localhost`), so try-on works on a real device
  out of the box; `CORS_ORIGINS` adds any extra web origins. (We deliberately do
  NOT enable CapacitorHttp — it would route MediaPipe's binary model download
  through the native bridge and risk the on-device face detection.)
- **Abuse limits:** per-IP rate limit on `/v1/tryon`; the endpoint refuses to run
  in production without `APP_API_KEY`; infra/verify failures return a retryable
  503 (not a misleading "not entitled").

### Known follow-up (not blocking a dormant deploy)

- **Face-similarity gate:** for maximum trust, add a face-embedding check on the
  output and reject+retry (or composite the edited region back over the original
  face) when identity drifts. Today we rely on the garment-only prompt + varied
  seed + the model's `has_nsfw_concepts` flag.
- **Charge-vs-deliver window (residual):** the StoreKit consumable is finished
  on-device at approval, before the backend render. If the app is killed
  mid-generation, the buyer is charged with no durable client/server record to
  re-issue. Mitigated by partial success + bounded retry; a full fix is to defer
  `finish()` until `/v1/tryon` succeeds, or add a server ledger that can re-issue
  an uncommitted-but-verified transaction.
- **Bind purchase to buyer (app side):** the backend already rejects a
  transaction whose `appAccountToken` ≠ caller, but the app does not yet set
  `appAccountToken` at purchase time — do that in `purchase.js` so the binding is
  enforced end-to-end.
