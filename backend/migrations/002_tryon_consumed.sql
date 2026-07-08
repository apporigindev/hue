-- Replay protection for the "See it for real" try-on consumable.
-- Each spent StoreKit transaction is recorded so the same signed transaction
-- cannot be re-sent to the /v1/tryon endpoint for free generations.
-- Anonymous by design: only an opaque transaction key + status. No personal
-- data and no photos are ever stored here.

create table if not exists tryon_consumed (
  tx_key      text primary key,                 -- e.g. 'apple:<transactionId>'
  status      text not null default 'reserved'  -- 'reserved' | 'spent'
                check (status in ('reserved', 'spent')),
  attempts    int  not null default 0,          -- bounded-retry counter (cost cap)
  created_at  timestamptz not null default now()
);

create index if not exists tryon_consumed_created_at_idx on tryon_consumed (created_at);
