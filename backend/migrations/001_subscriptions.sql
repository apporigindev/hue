-- Seasonist subscription entitlements.
-- Anonymous by design: keyed by a random app-user id the app generates on-
-- device. No personal data (no name, email, or photo) is ever stored here.

create table if not exists subscriptions (
  app_user_id             text primary key,
  platform                text not null check (platform in ('apple', 'google')),
  product_id              text,
  original_transaction_id text,
  status                  text not null check (status in ('active','in_grace','expired','refunded','revoked')),
  expires_at              timestamptz,
  environment             text,
  updated_at              timestamptz not null default now()
);

create index if not exists subscriptions_otid_idx
  on subscriptions (original_transaction_id);
